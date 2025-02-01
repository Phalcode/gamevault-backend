import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import fileTypeChecker from "file-type-checker";
import { mkdir, readdir, unlink, writeFile } from "fs/promises";
import path, { dirname } from "path";
import configuration from "../../configuration";
import { UsersService } from "../users/users.service";

@Injectable()
export class SavefileService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly usersService: UsersService) {}

  public async upload(
    userId: number,
    gameId: number,
    file: Express.Multer.File,
    executorUsername: string,
  ) {
    await this.usersService.checkIfUsernameMatchesIdOrIsAdminOrThrow(
      userId,
      executorUsername,
    );
    await this.validate(file.buffer);
    await this.saveToFileSystem(
      this.generateNewPath(userId, gameId),
      file.buffer,
    );
  }

  public async download(
    userId: number,
    gameId: number,
    executorUsername: string,
  ): Promise<string> {
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
    return savefiles[0];
  }

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
      if (last !== undefined) {
        const toDelete = paths.slice(-last);
        await Promise.all(toDelete.map((p) => unlink(p)));
      } else {
        await Promise.all(paths.map((p) => unlink(p)));
      }

      this.logger.debug({
        message: "Savefile successfully deleted from filesystem and database.",
        path,
      });
    } catch (error) {
      this.logger.error({
        message: "Error deleting savefile.",
        path,
        error,
      });
    }
  }

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
    mkdir(dirname(path), { recursive: true });
    await writeFile(path, savefileBuffer);
    this.logger.debug({
      message: "Savefile successfully saved to filesystem.",
      path,
    });
  }

  private generateNewPath(userId: number, gameId: number): string {
    return `${configuration.VOLUMES.SAVEFILES}/users/${userId}/games/${gameId}/saves/${Date.now()}.zip`;
  }

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
}
