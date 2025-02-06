import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  StreamableFile,
} from "@nestjs/common";
import { isUUID } from "class-validator";
import { randomUUID } from "crypto";
import fileTypeChecker from "file-type-checker";
import { createReadStream } from "fs";
import { mkdir, readdir, stat, unlink, writeFile } from "fs/promises";
import mime from "mime";
import path, { basename, dirname } from "path";
import configuration from "../../configuration";
import { UsersService } from "../users/users.service";

@Injectable()
export class SavefileService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly usersService: UsersService) {}

  /**
   * Uploads a new save file for a user and game
   * @param userId - ID of the user owning the save file
   * @param gameId - ID of the game the save belongs to
   * @param installationId - UUID4 string identifying the installation
   * @param file - The uploaded file buffer and metadata
   * @param executorUsername - Username of the user performing the action
   * @throws {BadRequestException} If the file validation fails
   * @throws {NotFoundException} If user/game validation fails
   */
  public async upload(
    userId: number,
    gameId: number,
    file: Express.Multer.File,
    executorUsername: string,
    installationId?: string,
  ) {
    this.logger.log(`User uploading save file for a game`, {
      userId,
      gameId,
    });
    await this.usersService.checkIfUsernameMatchesIdOrIsAdminOrThrow(
      userId,
      executorUsername,
    );
    if (installationId && !isUUID(installationId, 4)) {
      throw new BadRequestException("Installation ID must be a valid UUID v4.");
    }
    await this.validate(file.buffer);
    await this.saveToFileSystem(
      this.generateNewPath(userId, gameId, installationId),
      file.buffer,
    );
    await this.cleanupOldSaves(userId, gameId, executorUsername);
  }

  /**
   * Retrieves the most recent save file path for a user and game
   * @param userId - ID of the user owning the save file
   * @param gameId - ID of the game the save belongs to
   * @param executorUsername - Username of the user performing the action
   */
  public async download(
    userId: number,
    gameId: number,
    executorUsername: string,
  ): Promise<StreamableFile> {
    await this.usersService.checkIfUsernameMatchesIdOrIsAdminOrThrow(
      userId,
      executorUsername,
    );
    const savefiles = await this.findSavefilesByUserIdAndGameIdOrFail(
      userId,
      gameId,
    );
    if (!savefiles[0]) {
      throw new NotFoundException(
        `Savefile for user ${userId} and game ${gameId} was not found.`,
      );
    }
    const path = savefiles[0];
    const file = createReadStream(path);
    this.logger.log(`User downloading save file for a game`, {
      userId,
      gameId,
    });
    return new StreamableFile(file, {
      disposition: `attachment; filename="${basename(path)}"`,
      length: (await stat(path)).size,
      type: mime.getType(path),
    });
  }

  /**
   * Deletes save files for a user and game
   * @param userId - ID of the user owning the save files
   * @param gameId - ID of the game the saves belong to
   * @param executorUsername - Username of the user performing the action
   * @param last - Optional number of recent files to preserve (deletes older ones)
   * @remarks Will not delete files if TESTING.MOCK_FILES is true
   */
  public async delete(
    userId: number,
    gameId: number,
    executorUsername?: string,
    last?: number,
  ): Promise<void> {
    await this.usersService.checkIfUsernameMatchesIdOrIsAdminOrThrow(
      userId,
      executorUsername,
    );
    if (configuration.TESTING.MOCK_FILES) {
      this.logger.warn({
        message: "Not deleting media from filesystem.",
        reason: "TESTING_MOCK_FILES is set to true.",
      });
      return;
    }
    try {
      const paths = await this.findSavefilesByUserIdAndGameIdOrFail(
        userId,
        gameId,
      );
      if (last) {
        const toDelete = paths.slice(-last);
        await Promise.all(toDelete.map((p) => unlink(p)));
      } else {
        await Promise.all(paths.map((p) => unlink(p)));
      }
      this.logger.log("Savefile(s) successfully deleted from filesystem.", {
        userId,
        gameId,
      });
    } catch (error) {
      this.logger.error({
        message: "Error deleting savefile.",
        path,
        error,
      });
    }
  }

  /**
   * Finds and sorts all save files for a user and game
   * @param userId - ID of the user owning the save files
   * @param gameId - ID of the game the saves belong to
   * @returns {Promise<string[]>} Array of sorted file paths (newest first)
   * @throws {NotFoundException} If no save files are found
   */
  private async findSavefilesByUserIdAndGameIdOrFail(
    userId: number,
    gameId: number,
  ): Promise<string[]> {
    try {
      if (configuration.TESTING.MOCK_FILES) {
        this.logger.warn({
          message: "Not saving media to the filesystem.",
          reason: "TESTING_MOCK_FILES is set to true.",
        });
        return [];
      }
      const saveDir = path.dirname(this.generateNewPath(userId, gameId));
      const files = await readdir(saveDir);
      const paths = files
        .filter((file) => file.endsWith(".zip"))
        .map((file) => path.join(saveDir, file))
        .sort((a, b) => {
          return (
            parseInt(path.basename(b, ".zip"), 10) -
            parseInt(path.basename(a, ".zip"), 10)
          );
        });
      if (paths.length === 0) {
        throw new Error("No save files found");
      }
      this.logger.debug(`Found ${paths.length} save files`, {
        userId,
        gameId,
      });
      return paths;
    } catch (error) {
      throw new NotFoundException(
        `Savefile for user ${userId} and game ${gameId} was not found.`,
        {
          cause: error,
        },
      );
    }
  }

  /**
   * Saves a file buffer to the filesystem
   * @param path - Target path to save the file
   * @param savefileBuffer - Buffer containing the file data
   * @remarks Will not save files if TESTING.MOCK_FILES is true
   */
  private async saveToFileSystem(
    path: string,
    savefileBuffer: Buffer,
  ): Promise<void> {
    if (configuration.TESTING.MOCK_FILES) {
      this.logger.warn({
        message: "Not saving media to the filesystem.",
        reason: "TESTING_MOCK_FILES is set to true.",
      });
      return;
    }
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, savefileBuffer);
    this.logger.debug({
      message: "Savefile successfully saved to filesystem.",
      path,
    });
  }

  /**
   * Generates a new save file path with installation ID
   * @param userId - ID of the user owning the save file
   * @param gameId - ID of the game the save belongs to
   * @param installationId - UUID4 string identifying the installation
   * @returns {string} Generated file path in format: /users/{userId}/games/{gameId}/{timestamp}_{installationId}.zip
   */
  private generateNewPath(
    userId: number,
    gameId: number,
    installationId: string = randomUUID(),
  ): string {
    return `${configuration.VOLUMES.SAVEFILES}/users/${userId}/games/${gameId}/${Date.now()}_${installationId}.zip`;
  }

  /**
   * Validates a save file buffer as a ZIP file
   * @param savefileBuffer - Buffer containing the file data to validate
   * @throws {BadRequestException} If the file is not a valid ZIP
   */
  private async validate(savefileBuffer: Buffer) {
    const type = fileTypeChecker.detectFile(savefileBuffer);
    const errorContextObject = {
      type,
      bufferLength: savefileBuffer.length,
      bufferStart: savefileBuffer
        .toString("hex", 0, 32)
        .match(/.{1,2}/g)
        .join(" "),
    };
    if (!type?.extension || !type?.mimeType) {
      throw new BadRequestException(
        errorContextObject,
        "File type could not be detected. Please use a different file.",
      );
    }
    if (type.mimeType != "application/zip") {
      throw new BadRequestException(
        errorContextObject,
        `This file is a "${type.mimeType}", which is not supported.`,
      );
    }
  }

  /**
   * Cleans up old save files beyond the configured maximum
   * @param userId - ID of the user owning the save files
   * @param gameId - ID of the game the saves belong to
   * @param executorUsername - Username of the user performing the action
   */
  private async cleanupOldSaves(
    userId: number,
    gameId: number,
    executorUsername: string,
  ): Promise<void> {
    const maxSaves = configuration.SAVEFILES.MAX_SAVES;
    if (maxSaves <= 0) {
      return;
    }
    try {
      const saveFiles = await this.findSavefilesByUserIdAndGameIdOrFail(
        userId,
        gameId,
      );
      const currentCount = saveFiles.length;
      const excess = currentCount - maxSaves;
      if (excess > 0) {
        this.logger.log(`Deleting ${excess} old save files.`, {
          userId,
          gameId,
        });
        await this.delete(userId, gameId, executorUsername, excess);
      }
    } catch (error) {
      this.logger.error({
        message: "Error during cleanup of old save files",
        userId,
        gameId,
        error,
      });
    }
  }
}
