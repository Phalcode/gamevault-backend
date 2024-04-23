import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  forwardRef,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Image } from "./image.entity";
import configuration from "../../configuration";
import sharp from "sharp";
import { HttpService } from "@nestjs/axios";
import { catchError, firstValueFrom } from "rxjs";
import { AxiosError, AxiosResponse } from "axios";
import { randomUUID } from "crypto";
import fileTypeChecker from "file-type-checker";
import { UsersService } from "../users/users.service";
import { unlink, writeFile } from "fs/promises";
import { existsSync } from "fs";

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(Image)
    private imageRepository: Repository<Image>,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {}

  public async isAvailable(id: number): Promise<boolean> {
    try {
      if (!id) {
        throw new NotFoundException("No image id given!");
      }
      await this.findByImageIdOrFail(id);
      return true;
    } catch (error) {
      return false;
    }
  }

  public async findByImageIdOrFail(id: number): Promise<Image> {
    try {
      const image = await this.imageRepository.findOneByOrFail({ id });
      if (!existsSync(image.path) || configuration.TESTING.MOCK_FILES) {
        await this.delete(image);
        throw new NotFoundException("Image not found on filesystem.");
      }
      return image;
    } catch (error) {
      throw new NotFoundException(`Image with id ${id} was not found.`, {
        cause: error,
      });
    }
  }

  /**
   * Downloads an image from a given URL and saves it to the file system.
   *
   * @param {string} sourceUrl - The URL of the image to be downloaded.
   * @param {string} uploaderUsername - (optional) The username of the uploader.
   * @returns {Promise<Image>} The saved Image object.
   */
  async downloadByUrl(
    sourceUrl: string,
    uploaderUsername?: string,
  ): Promise<Image> {
    const image = new Image();
    image.source = sourceUrl;

    try {
      if (uploaderUsername) {
        image.uploader =
          await this.usersService.findByUsernameOrFail(uploaderUsername);
      }
      this.logger.debug({
        message: `Downloading image...`,
        url: sourceUrl,
        uploader: uploaderUsername,
      });
      const response = await this.fetchFromUrl(image.source);
      const imageBuffer = Buffer.from(response.data);
      const fileType = this.checkFileType(imageBuffer);

      image.path = `${configuration.VOLUMES.IMAGES}/${randomUUID()}.${
        fileType.extension
      }`;

      await this.saveToFileSystem(image.path, imageBuffer);
      return await this.imageRepository.save(image);
    } catch (error) {
      if (image.id) {
        await this.delete(image);
      }
      throw new InternalServerErrorException(
        `Failed to download image from '${sourceUrl}'.`,
        { cause: error },
      );
    }
  }

  private async fetchFromUrl(sourceUrl: string): Promise<AxiosResponse> {
    return await firstValueFrom(
      this.httpService
        .get(sourceUrl, {
          responseType: "arraybuffer",
          timeout: 30_000,
        })
        .pipe(
          catchError((error: AxiosError) => {
            throw new Error(
              `Failed to download image from ${sourceUrl}: ${error.status} ${error.message}`,
              { cause: error.toJSON() },
            );
          }),
        ),
    );
  }

  private checkFileType(imageBuffer: Buffer) {
    const fileType = fileTypeChecker.detectFile(imageBuffer);
    if (
      !configuration.IMAGE.SUPPORTED_IMAGE_FORMATS.includes(fileType.mimeType)
    ) {
      throw new BadRequestException(
        `Content Type "${fileType.mimeType}" is not supported. Please select a different image or convert it.`,
      );
    }
    return fileType;
  }

  private async saveToFileSystem(
    path: string,
    imageBuffer: Buffer,
  ): Promise<void> {
    if (configuration.TESTING.MOCK_FILES) {
      this.logger.warn({
        message: "Not saving image to the filesystem.",
        reason: "TESTING_MOCK_FILES is set to true.",
      });
      return;
    }
    this.logger.debug(`Compressing image...`);
    const compressedImageBuffer = await sharp(imageBuffer, {
      animated: true,
    }).toBuffer();
    await writeFile(path, compressedImageBuffer);
    this.logger.debug({
      message: "Image successfully saved to filesystem.",
      path,
    });
  }

  async delete(image: Image): Promise<void> {
    if (configuration.TESTING.MOCK_FILES) {
      this.logger.warn({
        message: "Not deleting image from filesystem.",
        reason: "TESTING_MOCK_FILES is set to true.",
      });
      return;
    }
    try {
      await this.imageRepository.remove(image);
      await unlink(image.path);
      this.logger.debug({
        message: "Image successfully deleted from filesystem and database.",
        image,
      });
    } catch (error) {
      this.logger.error({
        message: "Error deleting image.",
        image,
        error,
      });
    }
  }

  public async upload(
    file: Express.Multer.File,
    username: string,
  ): Promise<Image> {
    const image = await this.createFromUpload(file, username);

    try {
      await this.saveToFileSystem(image.path, file.buffer);
      const uploadedImage = await this.imageRepository.save(image);
      this.logger.log({
        message: "Image successfully uploaded.",
        image: uploadedImage,
        uploader: username,
      });
      return uploadedImage;
    } catch (error) {
      await this.delete(image);
      throw new InternalServerErrorException(
        "Error uploading image. Please retry or try another one.",
        { cause: error },
      );
    }
  }

  private async validate(imageBuffer: Buffer) {
    const type = fileTypeChecker.detectFile(imageBuffer);
    const errorContextObject = {
      type,
      bufferLength: imageBuffer.length,
      bufferStart: imageBuffer
        .toString("hex", 0, 32)
        .match(/.{1,2}/g)
        .join(" "),
    };
    if (!type?.extension || !type?.mimeType) {
      throw new BadRequestException(
        errorContextObject,
        "File type could not be detected. Please try another image.",
      );
    }
    if (!configuration.IMAGE.SUPPORTED_IMAGE_FORMATS.includes(type.mimeType)) {
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
  ): Promise<Image> {
    const fileType = await this.validate(file.buffer);
    const image = new Image();

    if (username) {
      image.uploader = await this.usersService.findByUsernameOrFail(username);
    }

    image.path = `${configuration.VOLUMES.IMAGES}/${randomUUID()}.${
      fileType.extension
    }`;
    image.mediaType = fileType.mimeType;
    return image;
  }
}
