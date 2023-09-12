import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
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
import { existsSync, unlinkSync, writeFileSync } from "fs";

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

  public async isImageAvailable(id: number): Promise<boolean> {
    try {
      if (!id) {
        throw new NotFoundException("No image id given!");
      }
      await this.findByIdOrFail(id);
      return true;
    } catch (error) {
      return false;
    }
  }

  public async findByIdOrFail(id: number): Promise<Image> {
    try {
      const image = await this.imageRepository.findOneByOrFail({ id });
      if (!existsSync(image.path) || configuration.TESTING.MOCK_FILES) {
        throw new NotFoundException("Image not found on filesystem.");
      }
      return image;
    } catch {
      await this.deleteImageById(id);
      throw new NotFoundException(`Image with id ${id} was not found.`);
    }
  }

  async downloadImageByUrl(
    sourceUrl: string,
    uploaderUsername?: string,
  ): Promise<Image> {
    const image = new Image();
    image.source = sourceUrl;

    try {
      if (uploaderUsername) {
        image.uploader =
          await this.usersService.getUserByUsernameOrFail(uploaderUsername);
      }
      const response = await this.downloadImageFromUrl(image.source);
      const imageBuffer = Buffer.from(response.data);
      const fileType = this.checkImageFileType(imageBuffer);

      image.path = `${configuration.VOLUMES.IMAGES}/${randomUUID()}.${
        fileType.extension
      }`;

      await this.saveImageToFileSystem(image.path, imageBuffer);
      return await this.imageRepository.save(image);
    } catch (error) {
      await this.deleteImageById(image?.id);
      throw new UnprocessableEntityException(
        `Failed to download image from '${sourceUrl}'.`,
      );
    }
  }

  private async downloadImageFromUrl(
    sourceUrl: string,
  ): Promise<AxiosResponse> {
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
            );
          }),
        ),
    );
  }

  private checkImageFileType(imageBuffer: Buffer) {
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

  private async saveImageToFileSystem(
    path: string,
    imageBuffer: Buffer,
  ): Promise<void> {
    if (configuration.TESTING.MOCK_FILES) {
      this.logger.warn(
        "Not saving image to the filesystem because TESTING_MOCK_FILES is set to true",
      );
      return;
    }
    this.logger.debug(`Compressing image...`);
    const compressedImageBuffer = await sharp(imageBuffer).toBuffer();
    writeFileSync(path, compressedImageBuffer);
    this.logger.debug(`Saved image to '${path}'`);
  }

  async deleteImageById(id: number): Promise<void> {
    if (configuration.TESTING.MOCK_FILES) {
      this.logger.warn(
        "Not deleting image from the filesystem because TESTING_MOCK_FILES is set to true",
      );
      return;
    }
    const image = await this.findByIdOrFail(id);
    await this.imageRepository.remove(image);
    unlinkSync(image.path);
    this.logger.debug(
      { imageId: image.id, path: image.path, deletedAt: image.deleted_at },
      `Image successfully hard deleted from the filesystem.`,
    );
  }

  public async uploadImage(
    file: Express.Multer.File,
    username: string,
  ): Promise<Image> {
    const image = await this.createImageFromUpload(file, username);

    try {
      await this.saveImageToFileSystem(image.path, file.buffer);
      this.logger.log(`Uploaded image ${image.id} to "${image.path}"`);
      return await this.imageRepository.save(image);
    } catch (error) {
      await this.deleteImageById(image?.id);
      throw new InternalServerErrorException(
        "Error uploading image. Please retry or try another one.",
      );
    }
  }

  private async validateImage(imageBuffer: Buffer) {
    const fileType = fileTypeChecker.detectFile(imageBuffer);
    if (!fileType?.extension || !fileType?.mimeType) {
      throw new BadRequestException(
        "File type could not be detected. Please try another image.",
      );
    }
    if (
      !configuration.IMAGE.SUPPORTED_IMAGE_FORMATS.includes(fileType.mimeType)
    ) {
      throw new BadRequestException(
        `This file is a "${fileType.mimeType}", which is not supported.`,
      );
    }
    return fileType;
  }

  private async createImageFromUpload(
    file: Express.Multer.File,
    username?: string,
  ): Promise<Image> {
    const fileType = await this.validateImage(file.buffer);
    const image = new Image();

    if (username) {
      image.uploader =
        await this.usersService.getUserByUsernameOrFail(username);
    }

    image.path = `${configuration.VOLUMES.IMAGES}/${randomUUID()}.${
      fileType.extension
    }`;
    image.mediaType = fileType.mimeType;
    return image;
  }
}
