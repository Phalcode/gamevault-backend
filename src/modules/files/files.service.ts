import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
  StreamableFile,
} from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { watch } from "chokidar";
import { randomBytes } from "crypto";
import { createReadStream, existsSync, statSync } from "fs";
import { readdir, stat } from "fs/promises";
import { debounce } from "lodash";
import mime from "mime";
import { add, list } from "node-7z";
import path, { basename, extname, join } from "path";
import filenameSanitizer from "sanitize-filename";
import { Readable } from "stream";
import { Throttle } from "stream-throttle";
import unidecode from "unidecode";

import configuration from "../../configuration";
import globals from "../../globals";
import { BoxArtsService } from "../boxarts/boxarts.service";
import { Game } from "../games/game.entity";
import mock from "../games/games.mock";
import { GamesService } from "../games/games.service";
import { GameExistence } from "../games/models/game-existence.enum";
import { GameType } from "../games/models/game-type.enum";
import { RawgService } from "../providers/rawg/rawg.service";
import ByteRangeStream from "./models/byte-range-stream";
import { IGameVaultFile } from "./models/file.model";
import { RangeHeader } from "./models/range-header.model";

@Injectable()
export class FilesService implements OnApplicationBootstrap {
  private logger = new Logger(FilesService.name);

  constructor(
    private gamesService: GamesService,
    private rawgService: RawgService,
    private boxartService: BoxArtsService,
  ) {}

  onApplicationBootstrap() {
    this.index("Initial indexing on application start").catch((error) => {
      this.logger.error({ message: "Error in initial file indexing", error });
    });

    if (configuration.TESTING.MOCK_FILES) {
      return;
    }

    watch(configuration.VOLUMES.FILES, {
      depth: configuration.GAMES.SEARCH_RECURSIVE ? undefined : 0,
    })
      .on(
        "all",
        debounce(() => {
          this.index(
            `Filewatcher detected changes in '${configuration.VOLUMES.FILES}'`,
          );
        }, 5000),
      )
      .on("error", (error) => {
        this.logger.error({ message: "Error in Filewatcher", error });
      });
  }

  @Cron(`*/${configuration.GAMES.INDEX_INTERVAL_IN_MINUTES || 60} * * * *`, {
    disabled: configuration.GAMES.INDEX_INTERVAL_IN_MINUTES === 0,
  })
  public async index(reason: string): Promise<Game[]> {
    this.logger.log({ message: "Indexing games.", reason });
    const gamesInFileSystem = await this.fetch();
    await this.ingest(gamesInFileSystem);
    let games = await this.gamesService.getAll();
    games = await this.checkIntegrity(gamesInFileSystem, games);
    games = await this.rawgService.checkCache(games);
    games = await this.boxartService.checkMultiple(games);
    return games;
  }

  private async ingest(gamesInFileSystem: IGameVaultFile[]): Promise<void> {
    this.logger.log({
      message: "Started ingesting games.",
      gamesCount: gamesInFileSystem.length,
    });
    for (const file of gamesInFileSystem) {
      const gameToIndex = new Game();
      try {
        gameToIndex.size = file.size;
        gameToIndex.file_path = `${file.path}`;
        gameToIndex.title = this.extractTitle(file.path);
        gameToIndex.release_date = this.extractReleaseYear(file.path);
        gameToIndex.version = this.extractVersion(file.path);
        gameToIndex.early_access = this.extractEarlyAccessFlag(
          basename(file.path),
        );
        // For each file, check if it already exists in the database.
        const existingGameTuple: [GameExistence, Game] =
          await this.gamesService.checkIfExistsInDatabase(gameToIndex);

        switch (existingGameTuple[0]) {
          case GameExistence.EXISTS: {
            this.logger.debug({
              message: `Identical file is already indexed in the database. Skipping it.`,
              game: {
                id: gameToIndex.id,
                file_path: gameToIndex.file_path,
              },
              existingGame: {
                id: existingGameTuple[1].id,
                file_path: existingGameTuple[1].file_path,
              },
            });
            continue;
          }

          case GameExistence.DOES_NOT_EXIST: {
            this.logger.debug({
              message: `Indexing new file.`,
              game: {
                id: gameToIndex.id,
                file_path: gameToIndex.file_path,
              },
            });
            gameToIndex.type = await this.detectType(gameToIndex.file_path);
            await this.gamesService.save(gameToIndex);
            continue;
          }

          case GameExistence.EXISTS_BUT_DELETED_IN_DATABASE: {
            this.logger.debug({
              message: `A Soft-deleted duplicate of the file has been found in the database. Restoring it and updating the information.`,
              game: {
                id: gameToIndex.id,
                file_path: gameToIndex.file_path,
              },
              existingGame: {
                id: existingGameTuple[1].id,
                file_path: existingGameTuple[1].file_path,
              },
            });
            const restoredGame = await this.gamesService.restore(
              existingGameTuple[1].id,
            );
            gameToIndex.type = await this.detectType(gameToIndex.file_path);
            await this.update(restoredGame, gameToIndex);
            continue;
          }

          case GameExistence.EXISTS_BUT_ALTERED: {
            this.logger.debug({
              message: `An altered duplicate of the file has been found in the database. Updating the information.`,
              game: {
                id: gameToIndex.id,
                file_path: gameToIndex.file_path,
              },
              existingGame: {
                id: existingGameTuple[1].id,
                file_path: existingGameTuple[1].file_path,
              },
            });
            gameToIndex.type = await this.detectType(gameToIndex.file_path);
            await this.update(existingGameTuple[1], gameToIndex);
            continue;
          }
        }
      } catch (error) {
        this.logger.error({
          message: `Failed to index file "${gameToIndex.file_path}". Does this file really belong here and are you sure the format is correct?`,
          game: { id: gameToIndex.id, file_path: file },
          error,
        });
      }
    }
    this.logger.log({
      message: "Finished ingesting games.",
      gamesCount: gamesInFileSystem.length,
    });
  }

  /** Updates the game information with the provided updates. */
  private async update(
    gameToUpdate: Game,
    updatesToApply: Game,
  ): Promise<void> {
    const updatedGame = {
      ...gameToUpdate,
      file_path: updatesToApply.file_path,
      title: updatesToApply.title,
      release_date: updatesToApply.release_date,
      size: updatesToApply.size,
      version: updatesToApply.version,
      early_access: updatesToApply.early_access,
      type: updatesToApply.type,
    };

    await this.gamesService.save(updatedGame);
    this.logger.log({
      message: `Updated new Game Information.`,
      game: {
        id: updatedGame.id,
        file_path: updatedGame.file_path,
      },
    });
  }

  private isValidFilename(filename: string) {
    const invalidCharacters = /[/<>:"\\|?*]/;
    const actualFilename = basename(filename);

    if (
      !configuration.GAMES.SUPPORTED_FILE_FORMATS.includes(
        extname(actualFilename)?.toLowerCase(),
      )
    ) {
      this.logger.debug({
        message: `Indexer ignoring invalid filename.`,
        reason: "Unsupported file extension.",
        filename,
      });
      return false;
    }

    if (invalidCharacters.test(actualFilename)) {
      this.logger.warn({
        message: `Indexer ignoring invalid filename.`,
        reason: "Contains invalid characters.",
        filename,
      });
      return false;
    }

    return true;
  }

  /**
   * This method extracts the game title from a given file name string using a
   * regular expression.
   */
  private extractTitle(filePath: string): string {
    const basename = path.basename(filePath, path.extname(filePath));
    const parenthesesRemoved = basename.replace(/\([^)]*\)/g, "");
    return parenthesesRemoved.trim();
  }

  /**
   * This method extracts the game version from a given file path string using a
   * regular expression.
   */
  private extractVersion(filePath: string): string | undefined {
    const match = RegExp(/\((v[^)]+)\)/).exec(basename(filePath));
    if (match?.[1]) {
      return match[1];
    }
    return undefined;
  }

  /**
   * This method extracts the game release year from a given file path string
   * using a regular expression.
   */
  private extractReleaseYear(filePath: string): Date {
    try {
      return new Date(RegExp(/\((\d{4})\)/).exec(basename(filePath))[1]);
    } catch (error) {
      return undefined;
    }
  }

  /**
   * This method extracts the early access flag from a given file path string
   * using a regular expression.
   */
  private extractEarlyAccessFlag(filePath: string): boolean {
    return /\(EA\)/.test(basename(filePath));
  }

  private detectWindowsSetupExecutable(filepaths: string[]): boolean {
    const windowsInstallerPatterns: { regex: RegExp; description: string }[] = [
      { regex: /^setup\.exe$/i, description: "setup.exe" },
      { regex: /^autorun\.exe$/i, description: "autorun.exe" },
      { regex: /^setup_.*\.exe$/i, description: "setup_*.exe" },
      { regex: /^setup-.*\.exe$/i, description: "setup-*.exe" },
      { regex: /^install\.exe$/i, description: "install.exe" },
      { regex: /^unarc\.exe$/i, description: "unarc.exe" },
      {
        regex: /^(?!.*\bredist\b).*\.msi$/,
        description: "*.msi (except redistributables)",
      },
    ];

    const detectedPatterns: string[] = [];

    for (const path of filepaths) {
      const fileName = basename(path)?.toLowerCase();

      for (const pattern of windowsInstallerPatterns) {
        if (pattern.regex.test(fileName)) {
          this.logger.debug({
            message: `File matched Windows Installer Game Type pattern.`,
            game: { id: undefined, file_path: path },
            pattern,
          });
          detectedPatterns.push(pattern.description);
        }
      }
    }

    return detectedPatterns.length > 0;
  }

  private async detectType(path: string): Promise<GameType> {
    try {
      if (/\(W_P\)/.test(path)) {
        this.logger.debug({
          message: `Detected game type as ${GameType.WINDOWS_PORTABLE}.`,
          reason: "(W_P) override in filename.",
          game: { id: undefined, file_path: path },
        });
        return GameType.WINDOWS_PORTABLE;
      }

      if (/\(W_S\)/.test(path)) {
        this.logger.debug({
          message: `Detected game type as ${GameType.WINDOWS_SETUP}.`,
          reason: "(W_S) override in filename.",
          game: { id: undefined, file_path: path },
        });
        return GameType.WINDOWS_SETUP;
      }

      if (/\(L_P\)/.test(path)) {
        this.logger.debug({
          message: `Detected game type as ${GameType.LINUX_PORTABLE}.`,
          reason: "(L_P) override in filename.",
          game: { id: undefined, file_path: path },
        });
        return GameType.LINUX_PORTABLE;
      }

      // Failsafe for Mock-Files because we cant look into them
      if (configuration.TESTING.MOCK_FILES) {
        this.logger.debug({
          message: `Detected game type as ${GameType.WINDOWS_SETUP}.`,
          reason: "TESTING_MOCK_FILES is set to true.",
          game: { id: undefined, file_path: path },
        });
        return GameType.WINDOWS_SETUP;
      }

      // Detect single File executables
      if (path?.toLowerCase().endsWith(".exe")) {
        this.logger.debug({
          message: `Detected game type as ${GameType.WINDOWS_SETUP}.`,
          reason: "Filename ends with .exe .",
          game: { id: undefined, file_path: path },
        });
        return GameType.WINDOWS_SETUP;
      }

      if (path?.toLowerCase().endsWith(".sh")) {
        this.logger.debug({
          message: `Detected game type as ${GameType.LINUX_PORTABLE}.`,
          reason: "Filename ends with .sh .",
          game: { id: undefined, file_path: path },
        });
        return GameType.LINUX_PORTABLE;
      }

      // Detect Windows Executables in Archive
      const windowsExecutablesInArchive =
        await this.getAllExecutablesFromArchive(path, ["*.exe", "*.msi"]);

      if (windowsExecutablesInArchive.length > 0) {
        if (this.detectWindowsSetupExecutable(windowsExecutablesInArchive)) {
          this.logger.debug({
            message: `Detected game type as ${GameType.WINDOWS_SETUP}.`,
            reason:
              "There are windows executables in the archive that look like installers.",
            game: { id: undefined, file_path: path },
          });
          return GameType.WINDOWS_SETUP;
        }
        this.logger.debug({
          message: `Detected game type as ${GameType.WINDOWS_PORTABLE}.`,
          reason: "There are windows executables in the archive.",
          game: { id: undefined, file_path: path },
        });
        return GameType.WINDOWS_PORTABLE;
      }

      const linuxExecutablesInArchive = await this.getAllExecutablesFromArchive(
        path,
        ["*.sh"],
      );
      if (linuxExecutablesInArchive.length > 0) {
        this.logger.debug({
          message: `Detected game type as ${GameType.LINUX_PORTABLE}.`,
          reason: "There are .sh files in the archive.",
          game: { id: undefined, file_path: path },
        });
        return GameType.WINDOWS_PORTABLE;
      }

      // More Platforms and Game Types can be added here.
      this.logger.debug({
        message: `Could not detect game type.`,
        game: { id: undefined, file_path: path },
      });
      return GameType.UNDETECTABLE;
    } catch (error) {
      this.logger.warn({
        message: `Error detecting game type.`,
        game: { id: undefined, file_path: path },
        error,
      });
      return GameType.UNDETECTABLE;
    }
  }

  private async getAllExecutablesFromArchive(
    path: string,
    matchers: string[],
  ): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      const executablesList: string[] = [];
      const listStream = list(path, {
        recursive: true,
        $cherryPick: matchers,
      });

      listStream.on("data", (data) => executablesList.push(data.file));

      listStream.on("error", (error) => {
        this.logger.error({
          message: `Error extracting executables list. Archive could be corrupted.`,
          game: { id: undefined, file_path: path },
          error,
        });
        reject(error);
      });

      listStream.on("end", () => {
        if (executablesList.length) {
          this.logger.debug({
            message: `Found ${executablesList.length} executable(s) in archive.`,
            game: { id: undefined, file_path: path },
            executables: executablesList,
          });
        } else {
          this.logger.warn({
            message: `Could not detect any executables in archive. Please note that the Game Type Detection algorithm does not support nested archives.`,
            game: { id: undefined, file_path: path },
          });
        }
        resolve(executablesList);
      });
    });
  }

  private async archive(output: string, sourcePath: string): Promise<void> {
    if (!existsSync(sourcePath)) {
      throw new NotFoundException(
        `The game file "${sourcePath}" could not be found.`,
      );
    }
    return new Promise<void>((resolve, reject) => {
      const archiveStream = add(output, sourcePath);
      archiveStream.on("error", (error) => {
        this.logger.error({
          message: `Error archiving game.`,
          input: sourcePath,
          output,
          error,
        });
        reject(error);
      });

      archiveStream.on("end", () => {
        this.logger.debug({
          message: `Archived game.`,
          input: sourcePath,
          output,
        });
        resolve();
      });
    });
  }

  /**
   * This method performs an integrity check by comparing the games in the file
   * system with the games in the database, marking the deleted games as deleted
   * in the database. Then returns the updated games in the database.
   */
  private async checkIntegrity(
    gamesInFileSystem: IGameVaultFile[],
    gamesInDatabase: Game[],
  ): Promise<Game[]> {
    if (configuration.TESTING.MOCK_FILES) {
      this.logger.log({
        message: "Skipping Integrity Check.",
        reason: "TESTING_MOCK_FILES is set to true",
      });
      return gamesInDatabase;
    }
    this.logger.log({
      message: "Started Integrity Check.",
      gamesCount: gamesInDatabase.length,
    });
    const updatedGames: Game[] = [];
    for (const gameInDatabase of gamesInDatabase) {
      try {
        const gameInFileSystem = gamesInFileSystem.find(
          (file) => file.path === gameInDatabase.file_path,
        );
        // If game is not in file system, mark it as deleted
        if (!gameInFileSystem) {
          await this.gamesService.delete(gameInDatabase);
          this.logger.log({
            message: `Game marked as soft-deleted.`,
            reason: "Game file not found in filesystem.",
            game: {
              id: gameInDatabase.id,
              file_path: gameInDatabase.file_path,
            },
          });
          continue;
        }
        updatedGames.push(gameInDatabase);
      } catch (error) {
        this.logger.error({
          message: `Error checking integrity of file.`,
          game: {
            id: gameInDatabase.id,
            file_path: gameInDatabase.file_path,
          },
          error,
        });
      }
    }
    this.logger.log({
      message: "Finished Integrity Check.",
      gamesCount: gamesInDatabase.length,
    });
    return updatedGames;
  }

  /**
   * This method retrieves an array of objects representing game files in the
   * file system.
   */
  private async fetch(): Promise<IGameVaultFile[]> {
    try {
      if (configuration.TESTING.MOCK_FILES) {
        return mock;
      }

      return (
        await readdir(configuration.VOLUMES.FILES, {
          encoding: "utf8",
          recursive: configuration.GAMES.SEARCH_RECURSIVE,
          withFileTypes: true,
        })
      )
        .filter((file) => file.isFile() && this.isValidFilename(file.name))
        .map(
          (file) =>
            ({
              path: join(file.path, file.name),
              size: BigInt(statSync(join(file.path, file.name)).size),
            }) as IGameVaultFile,
        );
    } catch (error) {
      throw new InternalServerErrorException(
        "Error reading /files directory!",
        { cause: error },
      );
    }
  }

  /**
   * Downloads a game file by ID and returns it as a StreamableFile object.
   *
   * @param gameId - The ID of the game to download.
   * @param speedlimitHeader - The maximum download speed limit in KBps (optional).
   * @param rangeHeader - The range header (optional).
   * @returns A Promise that resolves to a StreamableFile object.
   * @throws NotFoundException if the game file could not be found.
   */
  public async download(
    gameId: number,
    speedlimitHeader?: number,
    rangeHeader?: string,
  ): Promise<StreamableFile> {
    // Set the download speed limit if provided, otherwise use the default value from configuration.
    speedlimitHeader =
      speedlimitHeader || configuration.SERVER.MAX_DOWNLOAD_BANDWIDTH_IN_KBPS;
    speedlimitHeader *= 1024;

    // Find the game by ID.
    const game = await this.gamesService.findByGameIdOrFail(gameId);
    let fileDownloadPath = game.file_path;

    // If mocking files for testing, return a StreamableFile with random bytes.
    if (configuration.TESTING.MOCK_FILES) {
      this.logger.warn({
        message: "Returning random download data.",
        reason: "TESTING_MOCK_FILES is set to true.",
      });
      return new StreamableFile(randomBytes(1000), {
        disposition: `attachment; filename="${filenameSanitizer(
          unidecode(path.basename(fileDownloadPath)),
        )}"`,
        length: 1000,
        type: "application/x-zip",
      });
    }

    // If the file format is not supported, create an archive and use it for download.
    if (!globals.ARCHIVE_FORMATS.includes(path.extname(game.file_path))) {
      fileDownloadPath = `/tmp/${gameId}.tar`;

      // If the archive file does not exist, create it.
      if (!existsSync(fileDownloadPath)) {
        await this.archive(fileDownloadPath, game.file_path);
      }
    }

    // If the file does not exist, throw an exception.
    if (!existsSync(fileDownloadPath)) {
      throw new NotFoundException(
        `The game file "${fileDownloadPath}" could not be found.`,
      );
    }

    // Read the file and apply speed limit if necessary.
    let file: Readable = createReadStream(fileDownloadPath);

    // Apply range header if provided otherwise returns the entire file
    const range = this.calculateRange(
      rangeHeader,
      (await stat(fileDownloadPath)).size,
    );
    this.logger.debug({
      message: "Applying download range.",
      rangeHeader,
      range,
    });
    file = file.pipe(
      new ByteRangeStream(BigInt(range.start), BigInt(range.end)),
    );

    if (speedlimitHeader) {
      file = file.pipe(new Throttle({ rate: speedlimitHeader }));
    }

    return new StreamableFile(file, {
      disposition: `attachment; filename="${filenameSanitizer(
        unidecode(path.basename(fileDownloadPath)),
      )}"`,
      length: range.size,
      type: mime.getType(fileDownloadPath),
    });
  }

  /**
   * Parses the range header and returns the start, end, and size of the range.
   */
  private calculateRange(
    rangeHeader: string | undefined,
    fileSize: number,
  ): RangeHeader {
    let rangeStart: number = 0;
    let rangeEnd: number = fileSize;

    if (rangeHeader?.includes("-")) {
      const [extractedStart, extractedEnd] = rangeHeader
        .replace("bytes=", "")
        .split("-")
        .map(Number);

      if (!isNaN(extractedStart) && extractedStart < fileSize) {
        rangeStart = extractedStart;
      }
      if (
        !isNaN(extractedEnd) &&
        extractedEnd > rangeStart &&
        extractedEnd < fileSize
      ) {
        rangeEnd = extractedEnd;
      }
    }

    const rangeSize: number = rangeEnd - rangeStart;
    return {
      start: rangeStart,
      end: rangeEnd,
      size: rangeSize,
    };
  }
}
