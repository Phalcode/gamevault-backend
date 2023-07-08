import { Injectable, Logger, StreamableFile } from "@nestjs/common";
import { ICrackpipeFile } from "../models/file.interface";
import { Game } from "../database/entities/game.entity";
import { GamesService } from "./games.service";
import { createReadStream, readdirSync, statSync } from "fs";
import { extname } from "path";
import configuration from "../configuration";
import mock from "../mock/games.mock";
import mime from "mime";

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
      let game = new Game();
      game.title = this.regexExtractTitle(file.name);
      game.release_date = new Date(this.regexExtractReleaseYear(file.name));

      // For each file, check if it is in the database. Either by path (Exists Scenario) or by title and release date (Update Scenario).
      const existingGame = await this.gamesService.checkIfGameExists(
        file.name,
        game.title,
        game.release_date,
      );

      // If game exists and wasn't deleted, skip it
      if (existingGame && !existingGame.deleted_at) {
        this.logger.debug(`File "${file.name}" already exists in the database`);
        continue;
      }

      // If game exists but was deleted, restore it and index it with new info
      if (existingGame?.deleted_at) {
        this.logger.debug(
          `File "${file.name}" was marked as deleted in the database and is now restored`,
        );
        game = await this.gamesService.restoreGame(existingGame.id);
      }

      this.logger.debug(`Indexing file "${file.name}"`);
      game.file_path = file.name;
      game.version = this.regexExtractVersion(file.name);
      game.early_access = this.regexExtractEarlyAccessFlag(file.name);
      game.size = file.size;
      await this.gamesService.saveGame(game);
    }
    this.logger.log("FINISHED FILE INDEXING");
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
        //remove remaining spaces at end of string
        .trimEnd()
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
    const regex = /\(v.*\)/;
    const match = regex.exec(fileName);
    if (match) {
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
    return fileName.match(/\((\d{4})\)/)[1];
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
        this.logger.log(`Game "${gameInDatabase.file_path}" marked as deleted`);
      }
      // If game is in file system but has a different size, update it
      if (
        gameInFileSystem &&
        gameInFileSystem.size.toString() !== gameInDatabase.size.toString()
      ) {
        gameInDatabase.size = gameInFileSystem.size;
        await this.gamesService.saveGame(gameInDatabase);
        this.logger.warn(
          `Wrong size for game "${gameInDatabase.title}" detected. Corrected to ${gameInDatabase.size}.`,
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
