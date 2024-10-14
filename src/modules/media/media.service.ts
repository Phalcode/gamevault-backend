import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { randomUUID } from "crypto";
import fileTypeChecker from "file-type-checker";
import { existsSync } from "fs";
import { unlink, writeFile } from "fs/promises";
import { Repository } from "typeorm";

import configuration from "../../configuration";
import { logMedia } from "../../logging";
import { UsersService } from "../users/users.service";
import { Media } from "./media.entity";

@Injectable()
export class MediaService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  public async isAvailable(id: number): Promise<boolean> {
    try {
      if (!id) {
        throw new NotFoundException("No media id given!");
      }
      await this.findOneByMediaIdOrFail(id);
      return true;
    } catch (error) {
      return false;
    }
  }

  public async findOneByMediaIdOrFail(id: number): Promise<Media> {
    try {
      const media = await this.mediaRepository.findOneByOrFail({ id });
      if (!existsSync(media.file_path) || configuration.TESTING.MOCK_FILES) {
        await this.delete(media);
        throw new NotFoundException("Media not found on filesystem.");
      }
      return media;
    } catch (error) {
      throw new NotFoundException(`Media with id ${id} was not found.`, {
        cause: error,
      });
    }
  }

  /**
   * Downloads media from a given URL and saves it to the file system.
   *
   * @param {string} sourceUrl - The URL of the media file to be downloaded.
   * @param {string} uploaderUsername - (optional) The username of the uploader.
   * @returns {Promise<Media>} The saved Media object.
   */
  async downloadByUrl(
    sourceUrl: string,
    uploaderUsername?: string,
  ): Promise<Media> {
    const media = new Media();
    media.source_url = sourceUrl;

    try {
      if (uploaderUsername) {
        media.uploader =
          await this.usersService.findOneByUsernameOrFail(uploaderUsername);
      }
      const mediaBuffer = await this.fetchFromUrl(media.source_url);
      this.logger.debug({
        message: `Downloaded media.`,
        media: logMedia(media),
      });
      const validatedMediaBuffer = await this.validate(mediaBuffer);

      media.type = validatedMediaBuffer.mimeType;
      media.file_path = `${configuration.VOLUMES.MEDIA}/${randomUUID()}.${
        validatedMediaBuffer.extension
      }`;

      await this.saveToFileSystem(media.file_path, mediaBuffer);
      return await this.mediaRepository.save(media);
    } catch (error) {
      if (media.id) {
        await this.delete(media);
      }
      throw new InternalServerErrorException(
        `Failed to download media from '${sourceUrl}'.`,
        { cause: error },
      );
    }
  }

  private async fetchFromUrl(sourceUrl: string): Promise<Buffer> {
    try {
      const response = await fetch(sourceUrl, {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to download media from ${sourceUrl}: ${response.status} ${response.statusText}`,
        );
      }
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      this.logger.error(`Error downloading media from ${sourceUrl}`, error);
      throw new Error(`Failed to download media from ${sourceUrl}`, {
        cause: error,
      });
    }
  }

  private async saveToFileSystem(
    path: string,
    mediaBuffer: Buffer,
  ): Promise<void> {
    if (configuration.TESTING.MOCK_FILES) {
      this.logger.warn({
        message: "Not saving media to the filesystem.",
        reason: "TESTING_MOCK_FILES is set to true.",
      });
      return;
    }
    await writeFile(path, mediaBuffer);
    this.logger.debug({
      message: "Media successfully saved to filesystem.",
      path,
    });
  }

  async delete(media: Media): Promise<void> {
    if (configuration.TESTING.MOCK_FILES) {
      this.logger.warn({
        message: "Not deleting media from filesystem.",
        reason: "TESTING_MOCK_FILES is set to true.",
      });
      return;
    }
    try {
      await this.mediaRepository.remove(media);
      await unlink(media.file_path);
      this.logger.debug({
        message: "Media successfully deleted from filesystem and database.",
        media,
      });
    } catch (error) {
      this.logger.error({
        message: "Error deleting media.",
        media: logMedia(media),
        error,
      });
    }
  }

  public async upload(
    file: Express.Multer.File,
    username: string,
  ): Promise<Media> {
    const media = await this.createFromUpload(file, username);

    try {
      await this.saveToFileSystem(media.file_path, file.buffer);
      const uploadedMedia = await this.mediaRepository.save(media);
      this.logger.log({
        message: "Media successfully uploaded.",
        media: logMedia(uploadedMedia),
      });
      return uploadedMedia;
    } catch (error) {
      await this.delete(media);
      throw new InternalServerErrorException(
        "Error uploading media. Please retry or use a different file.",
        { cause: error },
      );
    }
  }

  private async validate(mediaBuffer: Buffer) {
    const type = fileTypeChecker.detectFile(mediaBuffer);
    const errorContextObject = {
      type,
      bufferLength: mediaBuffer.length,
      bufferStart: mediaBuffer
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
    if (!configuration.MEDIA.SUPPORTED_FORMATS.includes(type.mimeType)) {
      throw new BadRequestException(
        errorContextObject,
        `This file is a "${type.mimeType}", which is not supported.`,
      );
    }
    return type;
  }

  private async createFromUpload(
    file: Express.Multer.File,
    username?: string,
  ): Promise<Media> {
    const fileType = await this.validate(file.buffer);
    const media = new Media();
    media.type = fileType.mimeType;

    if (username) {
      media.uploader =
        await this.usersService.findOneByUsernameOrFail(username);
    }

    media.file_path = `${configuration.VOLUMES.MEDIA}/${randomUUID()}.${
      fileType.extension
    }`;
    return media;
  }
}
