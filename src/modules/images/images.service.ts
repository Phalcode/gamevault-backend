import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Image } from "./image.entity";
import * as fs from "fs";
import configuration from "../../configuration";
import sharp from "sharp";
import logger from "../../logging";
import { HttpService } from "@nestjs/axios";
import { catchError, firstValueFrom } from "rxjs";
import { AxiosError, AxiosResponse } from "axios";
import { randomUUID } from "crypto";
import fileTypeChecker from "file-type-checker";
import globals from "../../globals";

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(Image)
    private imageRepository: Repository<Image>,
  ) {}

  public async isImageAvailable(id: number): Promise<boolean> {
    try {
      await this.findByIdOrFail(id);
      return true;
    } catch (error) {
      return false;
    }
  }

  public async findByIdOrFail(id: number): Promise<Image> {
    const image = await this.findImageById(id);

    if (!this.isImageOnFileSystem(image)) {
      await this.handleImageNotFound(image);
    }
    return image;
  }

  private async findImageById(id: number): Promise<Image> {
    try {
      return await this.imageRepository.findOneByOrFail({ id });
    } catch {
      throw new NotFoundException(
        `Image with id ${id} was not found in the database.`,
      );
    }
  }

  private isImageOnFileSystem(image: Image): boolean {
    return fs.existsSync(image.path) || configuration.TESTING.MOCK_FILES;
  }

  private async handleImageNotFound(image: Image): Promise<void> {
    await this.deleteImageById(image.id);
    throw new NotFoundException(
      `Image with id ${image.id} was found in the database but not on the server's filesystem (${image.path}), so it was soft-deleted.`,
    );
  }

  async downloadImageByUrl(sourceUrl: string): Promise<Image> {
    const image = await this.createImageFromUrl(sourceUrl);

    try {
      const response = await this.downloadImageFromUrl(image.source);

      image.mediaType = response.headers["content-type"];
      this.checkImageMediaType(image);

      const imageBuffer = Buffer.from(response.data);
      this.checkImageFileType(imageBuffer);

      const compressedImageBuffer = await this.compressImage(imageBuffer);

      if (!configuration.TESTING.MOCK_FILES) {
        await this.saveImageToFileSystem(image, compressedImageBuffer);
      } else {
        this.logger.warn(
          "Not saving any image to filesystem because TESTING_MOCK_FILES is set to true",
        );
      }
      return await this.imageRepository.save(image);
    } catch (error) {
      await this.handleImageProcessingFailure(image, error);
      throw new UnprocessableEntityException(
        `Failed to download image from '${sourceUrl}'.`,
      );
    }
  }

  private async createImageFromUrl(sourceUrl: string): Promise<Image> {
    const image = new Image();
    image.source = sourceUrl;
    image.path = `${configuration.VOLUMES.IMAGES}/${randomUUID()}`;
    return image;
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

  private checkImageMediaType(image: Image): void {
    if (!image.mediaType.startsWith("image/")) {
      throw new UnprocessableEntityException(
        `Content Type '${image.mediaType}' is not a known image data type. Please choose a valid image.`,
      );
    }
  }

  private checkImageFileType(imageBuffer: Buffer): void {
    const fileType = fileTypeChecker.detectFile(imageBuffer);
    if (globals.SUPPORTED_IMAGE_FORMATS.includes(fileType.mimeType)) {
      throw new BadRequestException(
        `File type "${fileType.mimeType}" is not supported. Please select a different image or convert it.`,
      );
    }
  }

  private async compressImage(imageBuffer: Buffer): Promise<Buffer> {
    this.logger.debug(`Compressing image...`);
    return await sharp(imageBuffer).toBuffer();
  }

  private async saveImageToFileSystem(
    image: Image,
    compressedImageBuffer: Buffer,
  ): Promise<void> {
    fs.writeFileSync(image.path, compressedImageBuffer);
    this.logger.debug(`Saved image from '${image.source} to '${image.path}'`);
  }

  private async handleImageProcessingFailure(
    image: Image,
    error: unknown,
  ): Promise<void> {
    logger.error(
      { image, error },
      "Failed to process image. Clearing Remains.",
    );
    if (image.id) {
      await this.deleteImageById(image.id);
    }
  }

  async deleteImageById(id: number): Promise<void> {
    const image = await this.findImageById(id);
    await this.imageRepository.remove(image);
    this.hardDeleteImageFromFileSystem(image);
  }

  private hardDeleteImageFromFileSystem(image: Image): void {
    fs.unlinkSync(image.path);
    this.logger.debug(
      { imageId: image.id, path: image.path, deletedAt: image.deleted_at },
      `Image successfully hard deleted from file system.`,
    );
  }

  public async uploadImage(file: Express.Multer.File): Promise<Image> {
    const image = await this.createImageFromUpload(file);

    try {
      await this.saveImageToFileSystem(image, file.buffer);
      logger.log(`Uploaded image ${image.id} to "${image.path}"`);
      return await this.imageRepository.save(image);
    } catch (error) {
      await this.handleImageProcessingFailure(image, error);
      throw new InternalServerErrorException(
        "Error Uploading Image. Please retry or try another one.",
      );
    }
  }

  private async createImageFromUpload(
    file: Express.Multer.File,
  ): Promise<Image> {
    const image = new Image();
    const fileType = fileTypeChecker.detectFile(file.buffer);
    image.path = `${configuration.VOLUMES.IMAGES}/${randomUUID()}.${
      fileType.extension
    }`;
    image.mediaType = fileType.mimeType;
    return image;
  }
}
