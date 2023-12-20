import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
  StreamableFile,
} from "@nestjs/common";
import { IGameVaultFile } from "./models/file.model";
import { Game } from "../games/game.entity";
import { GamesService } from "../games/games.service";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
} from "fs";
import path, { basename, extname } from "path";
import configuration from "../../configuration";
import mock from "../games/games.mock";
import mime from "mime";
import { GameExistence } from "../games/models/game-existence.enum";
import { add, list } from "node-7z";
import { GameType } from "../games/models/game-type.enum";
import { RawgService } from "../providers/rawg/rawg.service";
import { BoxArtsService } from "../boxarts/boxarts.service";
import globals from "../../globals";
import filenameSanitizer from "sanitize-filename";
import unidecode from "unidecode";
import { randomBytes } from "crypto";
import { watch } from "chokidar";
import { debounce } from "lodash";
import { Readable } from "stream";
import { Throttle } from "stream-throttle";

@Injectable()
export class FilesService implements OnApplicationBootstrap {
  private logger = new Logger(FilesService.name);

  constructor(
    private gamesService: GamesService,
    private rawgService: RawgService,
    private boxartService: BoxArtsService,
  ) {}

  onApplicationBootstrap() {
    this.checkFolders();
    watch(configuration.VOLUMES.FILES, {
      depth: configuration.GAMES.SEARCH_RECURSIVE ? undefined : 0,
    })
      .on(
        "all",
        debounce(() => {
          this.index();
        }, 5000),
      )
      .on("error", (error) => {
        this.logger.error(error, "Error in Filewatcher");
      });
  }

  public async index(): Promise<void> {
    this.logger.log(
      `Started file indexer due to changes in ${configuration.VOLUMES.FILES}`,
    );
    const gamesInFileSystem = this.fetch();
    await this.ingest(gamesInFileSystem);
    const gamesInDatabase = await this.gamesService.getAll();
    await this.checkIntegrity(gamesInFileSystem, gamesInDatabase);
    await this.rawgService.checkCache(gamesInDatabase);
    await this.boxartService.checkMultiple(gamesInDatabase);
  }

  private async ingest(gamesInFileSystem: IGameVaultFile[]): Promise<void> {
    this.logger.log("Started Game Ingestion");
    for (const file of gamesInFileSystem) {
      const gameToIndex = new Game();
      try {
        gameToIndex.size = file.size;
        gameToIndex.file_path = `${configuration.VOLUMES.FILES}/${file.name}`;
        gameToIndex.title = this.extractTitle(file.name);
        gameToIndex.release_date = this.extractReleaseYear(file.name);
        gameToIndex.version = this.extractVersion(file.name);
        gameToIndex.early_access = this.extractEarlyAccessFlag(file.name);
        // For each file, check if it already exists in the database.
        const existingGameTuple: [GameExistence, Game] =
          await this.gamesService.checkIfExistsInDatabase(gameToIndex);

        switch (existingGameTuple[0]) {
          case GameExistence.EXISTS: {
            this.logger.debug(
              `An identical copy of file "${gameToIndex.file_path}" is already present in the database. Skipping it.`,
            );
            continue;
          }

          case GameExistence.DOES_NOT_EXIST: {
            this.logger.debug(`Indexing new file "${gameToIndex.file_path}"`);
            gameToIndex.type = await this.detectType(gameToIndex.file_path);
            await this.gamesService.save(gameToIndex);
            continue;
          }

          case GameExistence.EXISTS_BUT_DELETED: {
            this.logger.debug(
              `A soft-deleted duplicate of file "${gameToIndex.file_path}" has been detected in the database. Restoring it and updating the information.`,
            );
            const restoredGame = await this.gamesService.restore(
              existingGameTuple[1].id,
            );
            gameToIndex.type = await this.detectType(gameToIndex.file_path);
            await this.update(restoredGame, gameToIndex);
            continue;
          }

          case GameExistence.EXISTS_BUT_ALTERED: {
            this.logger.debug(
              `Detected changes in file "${gameToIndex.file_path}" in the database. Updating the information.`,
            );
            gameToIndex.type = await this.detectType(gameToIndex.file_path);
            await this.update(existingGameTuple[1], gameToIndex);
            continue;
          }
        }
      } catch (error) {
        this.logger.error(
          error,
          `Failed to index "${gameToIndex.file_path}". Does this file really belong here and are you sure the format is correct?"`,
        );
      }
    }
    this.logger.log("Finished Game Ingestion");
  }

  /** Updates the game information with the provided updates. */
  private async update(
    gameToUpdate: Game,
    updatesToApply: Game,
  ): Promise<Game> {
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

    this.logger.log(
      `Updated new Game Information for "${gameToUpdate.file_path}".`,
    );

    return this.gamesService.save(updatedGame);
  }

  private isValidFilename(filename: string) {
    const invalidCharacters = /[\/<>:"\\|?*]/;

    if (
      !configuration.GAMES.SUPPORTED_FILE_FORMATS.includes(
        extname(filename).toLowerCase(),
      )
    ) {
      this.logger.debug(
        `Indexer ignoring invalid filename: unsupported file extension - ${filename}`,
      );
      return false;
    }

    if (invalidCharacters.test(filename)) {
      this.logger.warn(
        `Indexer ignoring invalid filename: contains invalid characters - ${filename}`,
      );
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
   * This method extracts the game version from a given file name string using a
   * regular expression.
   */
  private extractVersion(fileName: string): string | undefined {
    const match = RegExp(/\((v[^)]+)\)/).exec(fileName);
    if (match?.[1]) {
      return match[1];
    }
    return undefined;
  }

  /**
   * This method extracts the game release year from a given file name string
   * using a regular expression.
   */
  private extractReleaseYear(fileName: string): Date {
    try {
      return new Date(RegExp(/\((\d{4})\)/).exec(fileName)[1]);
    } catch (error) {
      return undefined;
    }
  }

  /**
   * This method extracts the early access flag from a given file name string
   * using a regular expression.
   */
  private extractEarlyAccessFlag(fileName: string): boolean {
    return /\(EA\)/.test(fileName);
  }

  private detectWindowsSetupExecutable(files: string[]): boolean {
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

    for (const file of files) {
      const fileName = basename(file).toLowerCase();

      for (const pattern of windowsInstallerPatterns) {
        if (pattern.regex.test(fileName)) {
          this.logger.debug(
            `File "${file}" matched windows installer pattern "${pattern.description}"`,
          );
          detectedPatterns.push(pattern.description);
        }
      }
    }

    return detectedPatterns.length > 0;
  }

  private async detectType(path: string): Promise<GameType> {
    try {
      if (/\(W_P\)/.test(path)) {
        this.logger.debug(
          `Detected game "${path}" type as ${GameType.WINDOWS_PORTABLE}, because of (W_P) override in filename.`,
        );
        return GameType.WINDOWS_PORTABLE;
      }

      if (/\(W_S\)/.test(path)) {
        this.logger.debug(
          `Detected game "${path}" type as ${GameType.WINDOWS_SETUP}, because of (W_S) override in filename.`,
        );
        return GameType.WINDOWS_SETUP;
      }

      if (/\(L_P\)/.test(path)) {
        this.logger.debug(
          `Detected game "${path}" type as ${GameType.LINUX_PORTABLE}, because of (L_P) override in filename.`,
        );
        return GameType.LINUX_PORTABLE;
      }

      // Failsafe for Mock-Files because we cant look into them
      if (configuration.TESTING.MOCK_FILES) {
        this.logger.debug(
          `Detected game "${path}" type as ${GameType.WINDOWS_SETUP}, because TESTING_MOCK_FILES is set to true.`,
        );
        return GameType.WINDOWS_SETUP;
      }

      // Detect single File executables
      if (path.toLowerCase().endsWith(".exe")) {
        this.logger.debug(
          `Detected game "${path}" type as ${GameType.WINDOWS_SETUP}, because it ends with .exe`,
        );
        return GameType.WINDOWS_SETUP;
      }

      if (path.toLowerCase().endsWith(".sh")) {
        this.logger.debug(
          `Detected game "${path}" type as ${GameType.LINUX_PORTABLE}, because it ends with .sh`,
        );
        return GameType.LINUX_PORTABLE;
      }

      // Detect Windows Executables in Archive
      const windowsExecutablesInArchive =
        await this.getAllExecutablesFromArchive(path, ["*.exe", "*.msi"]);

      if (windowsExecutablesInArchive.length > 0) {
        if (this.detectWindowsSetupExecutable(windowsExecutablesInArchive)) {
          this.logger.debug(
            `Detected game "${path}" type as ${GameType.WINDOWS_SETUP}, because there are windows executables in the archive that look like installers.`,
          );
          return GameType.WINDOWS_SETUP;
        }
        this.logger.debug(
          `Detected game "${path}" type as ${GameType.WINDOWS_PORTABLE}, because there are windows executables in the archive.`,
        );
        return GameType.WINDOWS_PORTABLE;
      }

      const linuxExecutablesInArchive = await this.getAllExecutablesFromArchive(
        path,
        ["*.sh"],
      );
      if (linuxExecutablesInArchive.length > 0) {
        this.logger.debug(
          `Detected game "${path}" type as ${GameType.LINUX_PORTABLE}, because there are .sh files in the archive.`,
        );
        return GameType.WINDOWS_PORTABLE;
      }

      // More Platforms and Game Types can be added here.
      this.logger.debug(`Could not detect game type for "${path}"`);
      return GameType.UNDETECTABLE;
    } catch (error) {
      this.logger.warn(`Could not detect game type for "${path}"`, error);
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
        this.logger.error(
          error,
          `Error fetching Executables List for "${path}"`,
        );
        reject(error);
      });

      listStream.on("end", () => {
        if (executablesList.length) {
          this.logger.debug(
            executablesList,
            `Found ${executablesList.length} executables in archive "${path}"`,
          );
        } else {
          this.logger.warn(
            `Could not detect any executables in archive "${path}". Be aware that Game Type Detection does not support nested archives.`,
          );
        }
        resolve(executablesList);
      });
    });
  }

  private async archive(output: string, sourcePath: string): Promise<void> {
    if (!existsSync(sourcePath)) {
      throw new NotFoundException(`The game file could not be found.`);
    }
    return new Promise<void>((resolve, reject) => {
      const archiveStream = add(output, sourcePath);
      archiveStream.on("error", (error) => {
        this.logger.error(error, `Error archiving "${output}"`);
        reject(error);
      });

      archiveStream.on("end", () => {
        this.logger.debug(`Archived "${output}"`);
        resolve();
      });
    });
  }

  /**
   * This method performs an integrity check by comparing the games in the file
   * system with the games in the database, marking the deleted games as deleted
   * in the database.
   */
  private async checkIntegrity(
    gamesInFileSystem: IGameVaultFile[],
    gamesInDatabase: Game[],
  ): Promise<void> {
    if (configuration.TESTING.MOCK_FILES) {
      this.logger.log(
        "Skipping Integrity Check because TESTING.MOCK_FILE is true",
      );
      return;
    }
    this.logger.log("Started Integrity Check");
    for (const gameInDatabase of gamesInDatabase) {
      try {
        const gameInFileSystem = gamesInFileSystem.find(
          (game) =>
            `${configuration.VOLUMES.FILES}/${game.name}` ===
            gameInDatabase.file_path,
        );
        // If game is not in file system, mark it as deleted
        if (!gameInFileSystem) {
          await this.gamesService.delete(gameInDatabase);
          this.logger.log(
            `Game "${gameInDatabase.file_path}" marked as deleted, as it can not be found in the filesystem.`,
          );
          continue;
        }
      } catch (error) {
        this.logger.error(
          error,
          `Error checking integrity of file "${gameInDatabase.file_path}"`,
        );
      }
    }
    this.logger.log("Finished Integrity Check");
  }

  /**
   * This method retrieves an array of objects representing game files in the
   * file system.
   */
  private fetch(): IGameVaultFile[] {
    try {
      if (configuration.TESTING.MOCK_FILES) {
        return mock;
      }

      return readdirSync(configuration.VOLUMES.FILES, {
        encoding: "utf8",
        recursive: configuration.GAMES.SEARCH_RECURSIVE,
      })
        .filter((file) => this.isValidFilename(file))
        .map(
          (file) =>
            ({
              name: file,
              size: BigInt(
                statSync(`${configuration.VOLUMES.FILES}/${file}`).size,
              ),
            }) as IGameVaultFile,
        );
    } catch (error) {
      throw new InternalServerErrorException(
        error,
        "Error reading /files directory!",
      );
    }
  }

  /**
   * Downloads a game file by ID and returns it as a StreamableFile object.
   *
   * @param gameId - The ID of the game to download.
   * @param speedlimit - The maximum download speed limit in KBps (optional).
   * @returns A Promise that resolves to a StreamableFile object.
   * @throws NotFoundException if the game file could not be found.
   */
  public async download(
    gameId: number,
    speedlimit?: number,
  ): Promise<StreamableFile> {
    // Set the download speed limit if provided, otherwise use the default value from configuration.
    speedlimit =
      speedlimit || configuration.SERVER.MAX_DOWNLOAD_BANDWIDTH_IN_KBPS;
    speedlimit *= 1024;

    // Find the game by ID.
    const game = await this.gamesService.findByGameIdOrFail(gameId);
    let fileDownloadPath = game.file_path;

    // If mocking files for testing, return a StreamableFile with random bytes.
    if (configuration.TESTING.MOCK_FILES) {
      this.logger.warn(
        "Returning random download data because TESTING_MOCK_FILES is set to true",
      );
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
      throw new NotFoundException(`The game file could not be found.`);
    }

    // Read the file and apply speed limit if necessary.
    let file: Readable = createReadStream(fileDownloadPath);
    if (speedlimit) {
      file = file.pipe(new Throttle({ rate: speedlimit }));
    }

    // Get the file length, type, and sanitized filename.
    const length = statSync(fileDownloadPath).size;
    const type = mime.getType(fileDownloadPath);
    const filename = filenameSanitizer(
      unidecode(path.basename(fileDownloadPath)),
    );

    // Return a StreamableFile object with the file stream and metadata.
    return new StreamableFile(file, {
      disposition: `attachment; filename="${filename}"`,
      length,
      type,
    });
  }

  /** Checks and creates necessary folders if they do not exist. */
  private checkFolders() {
    if (configuration.TESTING.MOCK_FILES) {
      this.logger.warn(
        "Not checking or creating any folders because TESTING_MOCK_FILES is set to true",
      );
      return;
    }

    this.createDirectoryIfNotExist(
      configuration.VOLUMES.FILES,
      `Directory "${configuration.VOLUMES.FILES}" does not exist. Trying to create a new one...`,
    );

    this.createDirectoryIfNotExist(
      configuration.VOLUMES.IMAGES,
      `Directory "${configuration.VOLUMES.IMAGES}" does not exist. Trying to create a new one...`,
    );

    if (configuration.SERVER.LOG_FILES_ENABLED) {
      this.createDirectoryIfNotExist(
        configuration.VOLUMES.LOGS,
        `Directory "${configuration.VOLUMES.LOGS}" does not exist. Trying to create a new one...`,
      );
    }

    if (
      configuration.DB.SYSTEM === "SQLITE" &&
      !configuration.TESTING.IN_MEMORY_DB
    ) {
      this.createDirectoryIfNotExist(
        configuration.VOLUMES.SQLITEDB,
        `Directory "${configuration.VOLUMES.SQLITEDB}" does not exist. Trying to create a new one...`,
      );
    }
  }

  /** Creates a directory if it does not exist. */
  private createDirectoryIfNotExist(path: string, errorMessage: string): void {
    if (!existsSync(path)) {
      this.logger.error(errorMessage);
      mkdirSync(path);
    }
  }
}
