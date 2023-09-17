import {
  Injectable,
  InternalServerErrorException,
  Logger,
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
import { Cron } from "@nestjs/schedule";
import { RawgService } from "../providers/rawg/rawg.service";
import { BoxArtsService } from "../boxarts/boxarts.service";
import globals from "../../globals";
import Throttle from "throttle";

@Injectable()
export class FilesService implements OnApplicationBootstrap {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private gamesService: GamesService,
    private rawgService: RawgService,
    private boxartService: BoxArtsService,
  ) {}

  onApplicationBootstrap() {
    try {
      this.checkFolders();
      this.index();
    } catch (error) {
      this.logger.error(error, "Error on FilesService Bootstrap");
    }
  }

  @Cron(`*/${configuration.GAMES.INDEX_INTERVAL_IN_MINUTES} * * * *`)
  public async index(): Promise<void> {
    //Get all games in file system
    const gamesInFileSystem = this.fetchFiles();
    //Feed Game
    await this.ingestGames(gamesInFileSystem);
    //Get all games in database
    const gamesInDatabase = await this.gamesService.getAllGames();
    //Check integrity of games in database with games in file system
    await this.integrityCheck(gamesInFileSystem, gamesInDatabase);
    //Check cache of games in database
    await this.rawgService.cacheGames(gamesInDatabase);
    //Check boxart of games in database
    await this.boxartService.checkBoxArts(gamesInDatabase);
  }

  private async ingestGames(
    gamesInFileSystem: IGameVaultFile[],
  ): Promise<void> {
    this.logger.log("Started Game Ingestion");
    for (const file of gamesInFileSystem) {
      const gameToIndex = new Game();
      try {
        gameToIndex.size = file.size;
        gameToIndex.file_path = `${configuration.VOLUMES.FILES}/${file.name}`;
        gameToIndex.type = await this.detectGameType(gameToIndex.file_path);
        this.logger.debug(
          `Detected game "${gameToIndex.file_path}" type as ${gameToIndex.type}`,
        );
        gameToIndex.title = this.extractTitle(file.name);
        gameToIndex.release_date = this.extractReleaseYear(file.name);
        gameToIndex.version = this.extractVersion(file.name);
        gameToIndex.early_access = this.extractEarlyAccessFlag(file.name);

        // For each file, check if it already exists in the database.
        const existingGameTuple: [GameExistence, Game] =
          await this.gamesService.checkIfGameExistsInDatabase(gameToIndex);

        switch (existingGameTuple[0]) {
          case GameExistence.EXISTS: {
            this.logger.debug(
              `An identical copy of file "${gameToIndex.file_path}" is already present in the database. Skipping it.`,
            );
            continue;
          }

          case GameExistence.DOES_NOT_EXIST: {
            this.logger.debug(`Indexing new file "${gameToIndex.file_path}"`);
            await this.gamesService.saveGame(gameToIndex);
            continue;
          }

          case GameExistence.EXISTS_BUT_DELETED: {
            this.logger.debug(
              `A soft-deleted duplicate of file "${gameToIndex.file_path}" has been detected in the database. Restoring it and updating the information.`,
            );
            const restoredGame = await this.gamesService.restoreGame(
              existingGameTuple[1].id,
            );
            await this.updateGame(restoredGame, gameToIndex);
            continue;
          }

          case GameExistence.EXISTS_BUT_ALTERED: {
            this.logger.debug(
              `Detected changes in file "${gameToIndex.file_path}" in the database. Updating the information.`,
            );
            await this.updateGame(existingGameTuple[1], gameToIndex);
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

  /**
   * Updates the game information with the provided updates.
   *
   * @param {Game} gameToUpdate - The game to update.
   * @param {Game} updatesToApply - The updates to apply to the game.
   * @returns {Promise<Game>} The updated game.
   */
  private async updateGame(
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

    return this.gamesService.saveGame(updatedGame);
  }

  /**
   * This method extracts the game title from a given file name string using a
   * regular expression.
   *
   * @private
   * @param filePath - A string representing the files path.
   * @returns - The extracted game title string.
   */
  private extractTitle(filePath: string): string {
    const basename = path.basename(filePath, path.extname(filePath));
    const parenthesesRemoved = basename.replace(/\([^)]*\)/g, "");
    return parenthesesRemoved.trim();
  }

  /**
   * This method extracts the game version from a given file name string using a
   * regular expression.
   *
   * @private
   * @param fileName - A string representing the file name.
   * @returns - The extracted game version string or undefined if there's no
   *   match.
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
   *
   * @private
   * @param fileName - A string representing the file name.
   * @returns - The extracted game release year string or null if there's no
   *   match for the regular expression.
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
   *
   * @private
   * @param fileName - A string representing the file name.
   * @returns - A boolean value indicating if the game is in early access or
   *   not.
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

  private async detectGameType(path: string): Promise<GameType> {
    try {
      if (/\(W_P\)/.test(path)) {
        this.logger.debug(
          `Detected game "${path}" type as ${GameType.WINDOWS_PORTABLE} because of (W_P) override in filename.`,
        );
        return GameType.WINDOWS_PORTABLE;
      }

      if (/\(W_S\)/.test(path)) {
        this.logger.debug(
          `Detected game "${path}" type as ${GameType.WINDOWS_SETUP} because of (W_S) override in filename.`,
        );
        return GameType.WINDOWS_SETUP;
      }

      // Failsafe for Mock-Files because we cant look into them
      if (configuration.TESTING.MOCK_FILES) {
        return GameType.WINDOWS_SETUP;
      }

      // Detect single File executable
      if (path.toLowerCase().endsWith(".exe")) {
        return GameType.WINDOWS_SETUP;
      }

      const windowsExecutablesInArchive =
        await this.getAllExecutablesFromArchive(path, ["*.exe", "*.msi"]);

      if (windowsExecutablesInArchive.length > 0) {
        if (this.detectWindowsSetupExecutable(windowsExecutablesInArchive)) {
          return GameType.WINDOWS_SETUP;
        }
        return GameType.WINDOWS_PORTABLE;
      }

      // More Platforms and Game Types can be added here.
      return GameType.UNDETECTABLE;
    } catch (error) {
      this.logger.error("Error detecting game type:", error);
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

  private async archiveFiles(
    output: string,
    source: string | string[],
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const archiveStream = add(output, source);
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
   *
   * @async
   * @param gamesInFileSystem - An array of objects representing game files in
   *   the file system.
   * @param gamesInDatabase - An array of objects representing game records in
   *   the database.
   * @returns
   */
  private async integrityCheck(
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
          (g) =>
            `${configuration.VOLUMES.FILES}/${g.name}` ===
            gameInDatabase.file_path,
        );
        // If game is not in file system, mark it as deleted
        if (!gameInFileSystem) {
          await this.gamesService.deleteGame(gameInDatabase);
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
   *
   * @returns - An array of objects representing game files in the file system.
   * @throws {Error} - If there's an error during the process.
   * @public
   */
  private fetchFiles(): IGameVaultFile[] {
    try {
      if (configuration.TESTING.MOCK_FILES) {
        return mock;
      }

      return readdirSync(configuration.VOLUMES.FILES, {
        encoding: "utf8",
        recursive: configuration.GAMES.SEARCH_RECURSIVE,
      })
        .filter((file) =>
          configuration.GAMES.SUPPORTED_FILE_FORMATS.includes(
            extname(file).toLowerCase(),
          ),
        )
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
   * This method downloads a game file by ID and returns it as a StreamableFile
   * object.
   *
   * @async
   * @param gameId - The ID of the game to download.
   * @returns - A promise that resolves to a StreamableFile object representing
   *   the downloaded game file.
   * @public
   */
  public async downloadGame(
    gameId: number,
    speedlimit?: number,
  ): Promise<StreamableFile> {
    if (
      !speedlimit ||
      speedlimit * 1024 > configuration.SERVER.MAX_DOWNLOAD_BANDWIDTH_IN_KBPS
    ) {
      speedlimit = configuration.SERVER.MAX_DOWNLOAD_BANDWIDTH_IN_KBPS;
    } else {
      speedlimit *= 1024;
    }

    const game = await this.gamesService.getGameById(gameId);
    const fileExtension = RegExp(/(?:\.([^.]+))?$/).exec(game.file_path)[0];
    let fileDownloadPath = game.file_path;

    if (!globals.ARCHIVE_FORMATS.includes(fileExtension)) {
      fileDownloadPath = `/tmp/${gameId}.tar`;

      if (existsSync(fileDownloadPath)) {
        this.logger.debug(
          `Reusing temporary tarball "${fileDownloadPath}" for "${game.file_path}"`,
        );
      } else {
        this.logger.debug(
          `Temporarily tarballing "${game.file_path}" as "${fileDownloadPath}" for downloading...`,
        );
        await this.archiveFiles(fileDownloadPath, game.file_path);
      }
    }

    const file = createReadStream(fileDownloadPath).pipe(
      new Throttle(speedlimit),
    );
    const type = mime.getType(fileDownloadPath);

    const encodedFilename = encodeURIComponent(
      fileDownloadPath.replace(/^.*[\\/]/, ""),
    );
    const headers = {
      disposition: `attachment; filename*=UTF-8''${encodedFilename}; filename="${encodedFilename}"`,
      length: statSync(fileDownloadPath).size,
      type,
    };

    return new StreamableFile(file, headers);
  }

  /**
   * Checks and creates necessary folders if they do not exist.
   *
   * @private
   */
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

  /**
   * Creates a directory if it does not exist.
   *
   * @param {string} path - The path of the directory.
   * @param {string} errorMessage - The error message to log if the directory
   *   does not exist.
   */
  private createDirectoryIfNotExist(path: string, errorMessage: string): void {
    if (!existsSync(path)) {
      this.logger.error(errorMessage);
      mkdirSync(path);
    }
  }
}
