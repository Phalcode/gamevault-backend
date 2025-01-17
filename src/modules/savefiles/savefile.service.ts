import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import fileTypeChecker from "file-type-checker";
import { existsSync } from "fs";
import { unlink, writeFile } from "fs/promises";
import path from "path";
import configuration from "../../configuration";
import { GamesService } from "../games/games.service";
import { UsersService } from "../users/users.service";

@Injectable()
export class SavefileService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly gamesService: GamesService,
  ) {}

  //TODO: SOME SORT OF LIST WOULD BE GOOD.

  public async upload(
    userId: number,
    gameId: number,
    file: Express.Multer.File,
    username: string,
  ) {
    //TODO: CHECK PERMS
    await this.validate(file.buffer);
    //TODO: CREATE FILE / ROLLING?
  }

  public async download(
    userId: number,
    gameId: number,
    username?: string,
  ): Promise<string> {
    //TODO: CHECK PERMS
    return this.buildPath(userId, gameId);
    //TODO: HANDLE ERRRORS
  }

  public async delete(
    userId: number,
    gameId: number,
    username?: string,
  ): Promise<void> {
    //TODO: CHECK PERMS
    if (configuration.TESTING.MOCK_FILES) {
      this.logger.warn({
        message: "Not deleting media from filesystem.",
        reason: "TESTING_MOCK_FILES is set to true.",
      });
      return;
    }
    try {
      const path = await this.findByUserIdAndGameIdOrFail(userId, gameId);
      await unlink(path);
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

  private async findByUserIdAndGameIdOrFail(
    userId: number,
    gameId: number,
  ): Promise<string> {
    try {
      const path = this.buildPath(userId, gameId);
      if (!existsSync(path) || configuration.TESTING.MOCK_FILES) {
        throw new NotFoundException("Savefile not found on filesystem.");
      }
      return path;
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
    await writeFile(path, savefileBuffer);
    this.logger.debug({
      message: "Savefile successfully saved to filesystem.",
      path,
    });
  }

  private buildPath(userId: number, gameId: number): string {
    //TODO: PATH STRUCTURE?
    return `${configuration.VOLUMES.SAVEFILES}/user/${userId}/game/${gameId}/savefile.zip`;
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
