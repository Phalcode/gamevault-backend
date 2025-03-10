import {
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
  StreamableFile,
} from "@nestjs/common";
import { randomBytes } from "crypto";
import { Response } from "express";
import { Stats, createReadStream, existsSync, statSync } from "fs";
import { readdir, stat } from "fs/promises";
import { debounce, toLower } from "lodash";
import mime from "mime";
import { add, list } from "node-7z";
import path, { basename, join } from "path";
import filenameSanitizer from "sanitize-filename";
import { Readable } from "stream";
import { Throttle } from "stream-throttle";
import unidecode from "unidecode";

import { Cron } from "@nestjs/schedule";
import { watch } from "chokidar";
import configuration from "../../configuration";
import globals from "../../globals";
import { logGamevaultGame } from "../../logging";
import { MetadataService } from "../metadata/metadata.service";
import mock from "./games.mock";
import { GamesService } from "./games.service";
import { GamevaultGame } from "./gamevault-game.entity";
import { File } from "./models/file.model";
import { GameExistence } from "./models/game-existence.enum";
import { GameType } from "./models/game-type.enum";
import { RangeHeader } from "./models/range-header.model";

@Injectable()
export class FilesService implements OnApplicationBootstrap {
  private readonly logger = new Logger(this.constructor.name);

  private readonly runDebouncedIntegrityCheck = debounce(async () => {
    await this.checkIntegrity();
  }, 5000);

  constructor(
    private readonly gamesService: GamesService,
    private readonly metadataService: MetadataService,
  ) {}

  onApplicationBootstrap() {
    if (configuration.TESTING.MOCK_FILES) {
      this.logger.warn({
        message: "Skipping File Indexer.",
        reason: "TESTING_MOCK_FILES is set to true.",
      });
      return;
    }

    watch(configuration.VOLUMES.FILES, {
      depth: configuration.GAMES.SEARCH_RECURSIVE ? undefined : 0,
      ignorePermissionErrors: true,
      ignoreInitial: true,
      followSymlinks: true,
      alwaysStat: true,
      awaitWriteFinish: true,
    })
      .on("add", (path, stats) => this.index(path, stats))
      .on("change", (path, stats) => this.index(path, stats))
      .on("unlink", (path, stats) => this.index(path, stats))
      .on("error", (error) =>
        this.logger.error({ message: "Error in Filewatcher.", error }),
      );
    this.indexAllFiles();
  }

  @Cron(
    `*/${configuration.GAMES.INDEX_INTERVAL_IN_MINUTES > 0 ? configuration.GAMES.INDEX_INTERVAL_IN_MINUTES : 1} * * * *`,
    {
      disabled:
        configuration.GAMES.INDEX_INTERVAL_IN_MINUTES <= 0 ||
        configuration.TESTING.MOCK_FILES,
    },
  )
  public async indexAllFiles() {
    for (const file of await this.readAllFiles())
      this.index(file.path, { size: Number(file.size) } as Stats);
  }

  private async index(path: string, stats?: Stats) {
    const size = BigInt(stats?.size || 0);
    if (!size || !path || !this.isValidFilePath(path)) {
      return;
    }

    // Log the initial ingestion message
    this.logger.log({
      message: "Ingesting game.",
      path,
      size,
    });

    const gameToIndex = new GamevaultGame();
    gameToIndex.size = size;
    gameToIndex.file_path = path;
    gameToIndex.title = this.extractTitle(path);
    gameToIndex.sort_title = this.gamesService.generateSortTitle(
      gameToIndex.title,
    );
    gameToIndex.release_date = this.extractReleaseYear(path);
    gameToIndex.version = this.extractVersion(path);
    gameToIndex.early_access = this.extractEarlyAccessFlag(basename(path));

    try {
      // Check if the game already exists in the database
      const existingGameTuple: [GameExistence, GamevaultGame] =
        await this.gamesService.checkIfExistsInDatabase(gameToIndex);
      const existingGame = existingGameTuple[1];

      // Prepare log messages based on game existence status
      const logMessageMap = {
        [GameExistence.EXISTS]: `Identical file is already indexed in the database. Skipping it.`,
        [GameExistence.DOES_NOT_EXIST]: `Indexing new file.`,
        [GameExistence.EXISTS_BUT_DELETED_IN_DATABASE]: `A soft-deleted duplicate of the file has been found in the database. Restoring it and updating the information.`,
        [GameExistence.EXISTS_BUT_ALTERED]: `An altered duplicate of the file has been found in the database. Updating the information.`,
      };

      // Log the corresponding message based on game existence
      this.logger.debug({
        message: logMessageMap[existingGameTuple[0]],
        game: logGamevaultGame(gameToIndex),
        ...(existingGame && { existingGame: logGamevaultGame(existingGame) }),
      });

      // Handle different cases of game existence
      switch (existingGameTuple[0]) {
        case GameExistence.EXISTS: {
          // If it exists, just update the metadata
          this.metadataService.addUpdateMetadataJob(existingGame);
          break;
        }

        case GameExistence.DOES_NOT_EXIST: {
          // If it doesn't exist, detect the type and save it
          gameToIndex.type = await this.detectType(gameToIndex.file_path);
          this.metadataService.addUpdateMetadataJob(
            await this.gamesService.save(gameToIndex),
          );
          break;
        }

        case GameExistence.EXISTS_BUT_DELETED_IN_DATABASE: {
          // Restore soft-deleted game and update its information
          const restoredGame = await this.gamesService.restore(existingGame.id);
          gameToIndex.type = await this.detectType(gameToIndex.file_path);
          this.metadataService.addUpdateMetadataJob(
            await this.updateFileInfo(restoredGame.id, gameToIndex),
          );
          break;
        }

        case GameExistence.EXISTS_BUT_ALTERED: {
          // Update the information for an altered duplicate
          gameToIndex.type = await this.detectType(gameToIndex.file_path);
          this.metadataService.addUpdateMetadataJob(
            await this.updateFileInfo(existingGame.id, gameToIndex),
          );
        }
      }
    } catch (error) {
      // Log an error message if something goes wrong
      this.logger.error({
        message: `Failed to index file "${gameToIndex.file_path}". Does this file really belong here and are you sure the format is correct?`,
        game: { id: gameToIndex.id, path },
        error,
      });
    }

    this.runDebouncedIntegrityCheck();
  }

  /** Updates the game information with the information provided by the file. */
  private async updateFileInfo(
    id: number,
    updatesToApply: GamevaultGame,
  ): Promise<GamevaultGame> {
    const gameToUpdate = await this.gamesService.findOneByGameIdOrFail(id, {
      loadDeletedEntities: false,
    });

    gameToUpdate.file_path = updatesToApply.file_path;
    gameToUpdate.title = updatesToApply.title;
    gameToUpdate.sort_title = this.gamesService.generateSortTitle(
      updatesToApply.title,
    );
    gameToUpdate.release_date = updatesToApply.release_date;
    gameToUpdate.size = updatesToApply.size;
    gameToUpdate.version = updatesToApply.version;
    gameToUpdate.early_access = updatesToApply.early_access;
    gameToUpdate.type = updatesToApply.type;

    const updatedGame = await this.gamesService.save(gameToUpdate);
    this.logger.log({
      message: `Updated new Game Information based on file changes.`,
      game: logGamevaultGame(gameToUpdate),
    });
    return updatedGame;
  }

  private isValidFilePath(filename: string) {
    const invalidCharacters = /[/<>:"\\|?*]/;
    const actualFilename = basename(filename);

    if (
      !configuration.GAMES.SUPPORTED_FILE_FORMATS.includes(
        toLower(path.extname(actualFilename)),
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
    return path
      .basename(filePath, path.extname(filePath))
      .replace(/\([^)]*\)/g, "")
      .replace(/\s+/g, " ")
      .trim();
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
    } catch {
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
      const fileName = toLower(basename(path));

      for (const pattern of windowsInstallerPatterns) {
        if (pattern.regex.test(fileName)) {
          this.logger.debug({
            message: `File matched Windows Installer Game Type pattern.`,
            game: { id: undefined, path: path },
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
          game: { id: undefined, path: path },
        });
        return GameType.WINDOWS_PORTABLE;
      }

      if (/\(W_S\)/.test(path)) {
        this.logger.debug({
          message: `Detected game type as ${GameType.WINDOWS_SETUP}.`,
          reason: "(W_S) override in filename.",
          game: { id: undefined, path: path },
        });
        return GameType.WINDOWS_SETUP;
      }

      if (/\(L_P\)/.test(path)) {
        this.logger.debug({
          message: `Detected game type as ${GameType.LINUX_PORTABLE}.`,
          reason: "(L_P) override in filename.",
          game: { id: undefined, path },
        });
        return GameType.LINUX_PORTABLE;
      }

      // Failsafe for Mock-Files because we cant look into them
      if (configuration.TESTING.MOCK_FILES) {
        this.logger.debug({
          message: `Detected game type as ${GameType.WINDOWS_SETUP}.`,
          reason: "TESTING_MOCK_FILES is set to true.",
          game: { id: undefined, path },
        });
        return GameType.WINDOWS_SETUP;
      }

      // Detect single File executables
      if (toLower(path).endsWith(".exe")) {
        this.logger.debug({
          message: `Detected game type as ${GameType.WINDOWS_SETUP}.`,
          reason: "Filename ends with .exe .",
          game: { id: undefined, path },
        });
        return GameType.WINDOWS_SETUP;
      }

      if (toLower(path).endsWith(".sh")) {
        this.logger.debug({
          message: `Detected game type as ${GameType.LINUX_PORTABLE}.`,
          reason: "Filename ends with .sh .",
          game: { id: undefined, path },
        });
        return GameType.LINUX_PORTABLE;
      }

      // Detect Windows Executables in Archive
      const windowsExecutablesInArchive =
        await this.findAllExecutablesInArchive(path, ["*.exe", "*.msi"]);

      if (windowsExecutablesInArchive.length > 0) {
        if (this.detectWindowsSetupExecutable(windowsExecutablesInArchive)) {
          this.logger.debug({
            message: `Detected game type as ${GameType.WINDOWS_SETUP}.`,
            reason:
              "There are windows executables in the archive that look like installers.",
            game: { id: undefined, path },
          });
          return GameType.WINDOWS_SETUP;
        }
        this.logger.debug({
          message: `Detected game type as ${GameType.WINDOWS_PORTABLE}.`,
          reason: "There are windows executables in the archive.",
          game: { id: undefined, path },
        });
        return GameType.WINDOWS_PORTABLE;
      }

      const linuxExecutablesInArchive = await this.findAllExecutablesInArchive(
        path,
        ["*.sh"],
      );
      if (linuxExecutablesInArchive.length > 0) {
        this.logger.debug({
          message: `Detected game type as ${GameType.LINUX_PORTABLE}.`,
          reason: "There are .sh files in the archive.",
          game: { id: undefined, path },
        });
        return GameType.WINDOWS_PORTABLE;
      }

      // More Platforms and Game Types can be added here.
      this.logger.debug({
        message: `Could not detect game type.`,
        game: { id: undefined, path },
      });
      return GameType.UNDETECTABLE;
    } catch (error) {
      this.logger.warn({
        message: `Error detecting game type.`,
        game: { id: undefined, path },
        error,
      });
      return GameType.UNDETECTABLE;
    }
  }

  private async findAllExecutablesInArchive(
    path: string,
    matchers: string[],
  ): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      const executablesList: string[] = [];
      const listStream = list(path, {
        recursive: true,
        $cherryPick: matchers,
        password: configuration.GAMES.DEFAULT_ARCHIVE_PASSWORD, // ANY Password is needed so it doesn't hang up
      });

      listStream.on("data", (data) => executablesList.push(data.file));

      listStream.on("error", (error) => {
        this.logger.error({
          message: `Error extracting executables list. The archive may be encrypted or corrupted.`,
          game: { id: undefined, file_path: path },
          error,
        });
        reject(error);
      });

      listStream.on("end", () => {
        if (executablesList.length) {
          this.logger.debug({
            message: `Found ${executablesList.length} executable(s) in archive.`,
            game: { id: undefined, path: path },
            executables: executablesList,
          });
        } else {
          this.logger.warn({
            message: `Could not detect any executables in archive. Please note that the Game Type Detection algorithm does not support nested archives.`,
            game: { id: undefined, path: path },
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
  private async checkIntegrity(): Promise<GamevaultGame[]> {
    const gamesInFileSystem = await this.readAllFiles();
    const gamesInDatabase = await this.gamesService.find({
      loadDeletedEntities: false,
      loadRelations: true,
    });

    if (configuration.TESTING.MOCK_FILES) {
      this.logger.log({
        message: "Skipping Integrity Check.",
        reason: "TESTING_MOCK_FILES is set to true",
      });
      return gamesInDatabase;
    }
    this.logger.log({
      message: "Started Game Integrity Check.",
      count: gamesInDatabase.length,
    });
    const checkedGames: GamevaultGame[] = [];
    for (const gameInDatabase of gamesInDatabase) {
      try {
        const gameInFileSystem = gamesInFileSystem.find(
          (file) => file.path === gameInDatabase.file_path,
        );
        // If game is not in file system, mark it as deleted
        if (!gameInFileSystem) {
          await this.gamesService.delete(gameInDatabase.id);
          this.logger.log({
            message: `Game marked as soft-deleted.`,
            reason: "Game file not found in filesystem.",
            game: {
              id: gameInDatabase.id,
              path: gameInDatabase.file_path,
            },
          });
          continue;
        }
        checkedGames.push(gameInDatabase);
      } catch (error) {
        this.logger.error({
          message: `Error checking integrity of file.`,
          game: {
            id: gameInDatabase.id,
            path: gameInDatabase.file_path,
          },
          error,
        });
      }
    }
    this.logger.log({
      message: "Finished Game Integrity Check.",
      count: gamesInDatabase.length,
    });
    return checkedGames;
  }

  /**
   * This method retrieves an array of objects representing game files in the
   * file system.
   */
  private async readAllFiles(): Promise<File[]> {
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
        .filter((file) => file.isFile() && this.isValidFilePath(file.name))
        .map(
          (file) =>
            ({
              path: join(file.path, file.name),
              size: BigInt(statSync(join(file.path, file.name)).size),
            }) as File,
        );
    } catch (error) {
      this.logger.error({
        message: `Error reading files.`,
        error,
      });
      return [];
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
    response: Response,
    gameId: number,
    speedlimitHeader?: number,
    rangeHeader?: string,
    filterByAge?: number,
  ): Promise<StreamableFile> {
    // Set the download speed limit if provided, otherwise use the default value from configuration.
    speedlimitHeader =
      speedlimitHeader || configuration.SERVER.MAX_DOWNLOAD_BANDWIDTH_IN_KBPS;
    speedlimitHeader *= 1024;

    // Find the game by ID.
    const game = await this.gamesService.findOneByGameIdOrFail(gameId, {
      loadDeletedEntities: false,
      filterByAge,
    });
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

    // Read the file and apply speed limit if necessary.
    let file: Readable = createReadStream(fileDownloadPath, {
      start: range.start,
      end: range.end,
    });

    response.setHeader("X-Download-Size", range.size);

    if (speedlimitHeader) {
      file = file.pipe(new Throttle({ rate: speedlimitHeader }));
    }

    // Increment the download count.
    game.download_count++;
    this.gamesService.save(game);

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
    let rangeStart = 0;
    let rangeEnd = fileSize - 1;

    if (rangeHeader?.includes("-")) {
      const [start, end] = rangeHeader.replace("bytes=", "").split("-");

      if (start) {
        const parsedStart = Number(start);
        if (!isNaN(parsedStart) && parsedStart < fileSize) {
          rangeStart = parsedStart;
        }
      }

      if (end) {
        const parsedEnd = Number(end);
        if (!isNaN(parsedEnd) && parsedEnd < fileSize) {
          rangeEnd = parsedEnd >= rangeStart ? parsedEnd : rangeEnd;
        }
      }
    }

    const rangeSize = rangeEnd - rangeStart + 1;
    return {
      start: rangeStart,
      end: rangeEnd,
      size: rangeSize,
    };
  }
}
