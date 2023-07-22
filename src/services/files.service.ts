import { Injectable, Logger, StreamableFile } from "@nestjs/common";
import { IGameVaultFile } from "../models/file.interface";
import { Game } from "../database/entities/game.entity";
import { GamesService } from "./games.service";
import { createReadStream, readdirSync, statSync } from "fs";
import { extname } from "path";
import configuration from "../configuration";
import mock from "../mock/games.mock";
import mime from "mime";
import { GameExistance } from "../models/game-existance.enum";
import { GameType } from "../models/game-type.enum";
import { list } from "node-7z";
import { promisify } from "util";

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(private gamesService: GamesService) {}

  /**
   * This method indexes games files by extracting their relevant information
   * and saving them in the database.
   *
   * @async
   * @param gamesInFileSystem - An array of objects representing game files in
   *   the file system.
   * @returns
   * @throws {Error} - If there's an error during the process.
   */
  public async indexFiles(gamesInFileSystem: IGameVaultFile[]): Promise<void> {
    this.logger.log(gamesInFileSystem, "STARTED FILE INDEXING");
    for (const file of gamesInFileSystem) {
      const gameToIndex = new Game();
      try {
        gameToIndex.file_path = `${configuration.VOLUMES.FILES}/${file.name}`;
        //gameToIndex.type = await this.extractGameType(gameToIndex.file_path);
        gameToIndex.title = this.regexExtractTitle(file.name);
        gameToIndex.size = file.size;
        gameToIndex.release_date = new Date(
          this.regexExtractReleaseYear(file.name),
        );
        gameToIndex.version = this.regexExtractVersion(file.name);
        gameToIndex.early_access = this.regexExtractEarlyAccessFlag(file.name);

        // For each file, check if it already exists in the database.
        const existingGameTuple: [GameExistance, Game] =
          await this.gamesService.checkIfGameExistsInDatabase(gameToIndex);

        switch (existingGameTuple[0]) {
          case GameExistance.EXISTS: {
            this.logger.debug(
              `An identical copy of file "${gameToIndex.file_path}" is already present in the database. Skipping it.`,
            );
            continue;
          }

          case GameExistance.DOES_NOT_EXIST: {
            this.logger.debug(`Indexing new file "${gameToIndex.file_path}"`);
            await this.gamesService.saveGame(gameToIndex);
            continue;
          }

          case GameExistance.EXISTS_BUT_DELETED: {
            this.logger.debug(
              `A soft-deleted duplicate of file "${gameToIndex.file_path}" has been detected in the database. Restoring it and updating the information.`,
            );
            const restoredGame = await this.gamesService.restoreGame(
              existingGameTuple[1].id,
            );
            await this.updateGame(restoredGame, gameToIndex);
            continue;
          }

          case GameExistance.EXISTS_BUT_ALTERED: {
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
    this.logger.log("FINISHED FILE INDEXING");
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
   * @param fileName - A string representing the file name.
   * @returns - The extracted game title string.
   */
  private regexExtractTitle(fileName: string): string {
    return (
      fileName
        //remove directory
        .replace(/^.*[\\/]/, "")
        //remove extension
        .replace(/\.([^.]*)$/, "")
        //remove everything inside parentheses
        .replaceAll(/\([^)]*\)/g, "")
        //remove remaining spaces at start and end of string
        .trim()
    );
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
  private regexExtractVersion(fileName: string): string | undefined {
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
  private regexExtractReleaseYear(fileName: string) {
    return RegExp(/\((\d{4})\)/).exec(fileName)[1];
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
  private regexExtractEarlyAccessFlag(fileName: string): boolean {
    return /\(EA\)/.test(fileName);
  }

  /** Checks if any of the executables match "setup.exe" or "setup_*.exe". */
  private regexExtractSetupExecutable(executables: string[]): boolean {
    return executables.some((executable) =>
      /(^setup\.exe$|^setup_.*\.exe$)/.test(executable),
    );
  }

  /**
   * Extracts the game type based on the provided file name and its contents.
   * This function uses the node-7z library to list the contents of the archive
   * (if applicable) and then determines the game type based on the presence of
   * certain patterns in the file name and the listed files.
   *
   * @async
   * @private
   * @param {string} path - The path of the file/archive to be analyzed.
   * @returns {Promise<GameType>} A promise that resolves to the determined
   *   GameType.
   * @throws {Error} If any error occurs during the process, it will be caught
   *   and logged.
   */
  private async extractGameType(path: string): Promise<GameType> {
    try {
      if (/\(DP\)/.test(path)) {
        this.logger.debug(
          `Manually overwrote game "${path}" as type: DIRECT_PLAY`,
        );
        return GameType.DIRECT_PLAY;
      }

      if (/\(SN\)/.test(path)) {
        this.logger.debug(
          `Manually overwrote game "${path}" as type: SETUP_NEEDED`,
        );
        return GameType.SETUP_NEEDED;
      }

      // Failsafe for Mock-Files because we cant look into them
      if (configuration.TESTING.MOCK_FILES) {
        return GameType.SETUP_NEEDED;
      }

      const promisifiedList = promisify(list);
      const executablesList = (await promisifiedList(path, {
        $cherryPick: ["*.exe"],
        recursive: true,
      })) as string[];

      this.logger.log("List of executables in archive:", executablesList);

      if (this.regexExtractSetupExecutable(executablesList)) {
        this.logger.debug(`Detected game "${path}" as type: SETUP_NEEDED`);
        return GameType.SETUP_NEEDED;
      }

      this.logger.debug(`Detected game "${path}" as type: DIRECT_PLAY`);
      return GameType.DIRECT_PLAY;
    } catch (error) {
      this.logger.error("Error determining game type:", error);
      return GameType.UNDETECTABLE;
    }
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
  public async integrityCheck(
    gamesInFileSystem: IGameVaultFile[],
    gamesInDatabase: Game[],
  ): Promise<void> {
    if (configuration.TESTING.MOCK_FILES) {
      this.logger.log(
        "Skipping Integrity Check because TESTING.MOCK_FILE is true",
      );
      return;
    }
    this.logger.log("STARTED INTEGRITY CHECK");
    for (const gameInDatabase of gamesInDatabase) {
      const gameInFileSystem = gamesInFileSystem.find(
        (g) => g.name === gameInDatabase.file_path,
      );
      // If game is not in file system, mark it as deleted
      if (!gameInFileSystem) {
        await this.gamesService.deleteGame(gameInDatabase);
        this.logger.log(
          `Game "${gameInDatabase.file_path}" marked as deleted, as it can not be found in the filesystem.`,
        );
      }
    }
    this.logger.log("FINISHED INTEGRITY CHECK");
  }

  /**
   * This method retrieves an array of objects representing game files in the
   * file system.
   *
   * @returns - An array of objects representing game files in the file system.
   * @throws {Error} - If there's an error during the process.
   * @public
   */
  public getFiles(): IGameVaultFile[] {
    if (configuration.TESTING.MOCK_FILES) {
      return mock;
    }

    const files = readdirSync(configuration.VOLUMES.FILES, {
      encoding: "utf8",
      recursive: true,
    })
      .filter((file) =>
        [
          ".7z",
          ".xz",
          ".bz2",
          ".gz",
          ".tar",
          ".zip",
          ".wim",
          ".ar",
          ".arj",
          ".cab",
          ".chm",
          ".cpio",
          ".cramfs",
          ".dmg",
          ".ext",
          ".fat",
          ".gpt",
          ".hfs",
          ".ihex",
          ".iso",
          ".lzh",
          ".lzma",
          ".mbr",
          ".msi",
          ".nsis",
          ".ntfs",
          ".qcow2",
          ".rar",
          ".rpm",
          ".squashfs",
          ".udf",
          ".uefi",
          ".vdi",
          ".vhd",
          ".vmdk",
          ".wim",
          ".xar",
          ".z",
        ].includes(extname(file).toLowerCase()),
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

    return files;
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
  public async downloadGame(gameId: number): Promise<StreamableFile> {
    const game = await this.gamesService.getGameById(gameId);
    const file = createReadStream(game.file_path);
    const type = mime.getType(game.file_path);

    return new StreamableFile(file, {
      disposition: `attachment; filename=${encodeURIComponent(game.file_path)}`,
      length: Number(game.size),
      type,
    });
  }
}
