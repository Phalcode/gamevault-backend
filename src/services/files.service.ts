import { Injectable, Logger, StreamableFile } from "@nestjs/common";
import { ICrackpipeFile } from "../models/file.interface";
import { Game } from "../database/entities/game.entity";
import { GamesService } from "./games.service";
import { createReadStream, readdirSync, statSync } from "fs";
import { extname } from "path";
import configuration from "../configuration";
import mock from "../mock/games.mock";
import mime from "mime";
import { GameExistance } from "../models/game-existance.enum";

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
  public async indexFiles(gamesInFileSystem: ICrackpipeFile[]): Promise<void> {
    this.logger.log("STARTED FILE INDEXING");
    for (const file of gamesInFileSystem) {
      const gameToIndex = new Game();
      try {
        gameToIndex.release_date = new Date(
          this.regexExtractReleaseYear(gameToIndex.file_path),
        );
        gameToIndex.title = this.regexExtractTitle(gameToIndex.file_path);
        gameToIndex.file_path = file.name;
        gameToIndex.version = this.regexExtractVersion(gameToIndex.file_path);
        gameToIndex.early_access = this.regexExtractEarlyAccessFlag(
          gameToIndex.file_path,
        );
        gameToIndex.size = file.size;

        // For each file, check if it already exists in the database.
        const existingGameTuple: [
          GameExistance,
          Game,
        ] = await this.gamesService.checkIfGameExistsInDatabase(gameToIndex);

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
              `A duplicate of file "${gameToIndex.file_path}" has been detected in the database. Restoring it and updating the information.`,
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
          `Failed to index "${gameToIndex.file_path}. Does this file really belong here and are you sure the format is correct?"`,
          error,
        );
      }
    }
    this.logger.log("FINISHED FILE INDEXING");
  }
  private async updateGame(gameToUpdate: Game, updatesToApply: Game) {
    this.logger.log("Updating new Game Information", {
      old: gameToUpdate,
      new: { ...gameToUpdate, ...updatesToApply },
    });

    gameToUpdate = { ...gameToUpdate, ...updatesToApply };
    return this.gamesService.saveGame(gameToUpdate);
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
    gamesInFileSystem: ICrackpipeFile[],
    gamesInDatabase: Game[],
  ): Promise<void> {
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
      // If game is in file system but has a different size, update it
      if (
        gameInFileSystem &&
        gameInFileSystem.size.toString() !== gameInDatabase.size.toString()
      ) {
        this.logger.warn(
          `Detected wrong file size for game "${
            gameInDatabase.file_path
          }" in database. Correcting it from ${gameInDatabase.size.toString()} bytes to ${gameInFileSystem.size.toString()} bytes.`,
        );
        gameInDatabase.size = gameInFileSystem.size;
        await this.gamesService.saveGame(gameInDatabase);
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
  public getFiles(): ICrackpipeFile[] {
    if (configuration.TESTING.MOCK_FILES) {
      return mock;
    }

    const files = readdirSync("/files", "utf-8")
      .filter((file) =>
        [
          ".zip",
          ".7z",
          ".rar",
          ".tar",
          ".tar.gz",
          ".tar.bz2",
          ".tar.xz",
          ".tgz",
          ".tbz2",
          ".txz",
        ].includes(extname(file)),
      )
      .map(
        (file) =>
          ({
            name: file,
            size: BigInt(statSync(`/files/${file}`).size),
          } as ICrackpipeFile),
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
    const file = createReadStream(`/files/${game.file_path}`);
    const type = mime.getType(game.file_path);

    return new StreamableFile(file, {
      disposition: `attachment; filename=${encodeURIComponent(game.file_path)}`,
      length: Number(game.size),
      type,
    });
  }
}
