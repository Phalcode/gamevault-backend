import {
  Injectable,
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
import { AxiosError } from "axios";
import { randomUUID } from "crypto";

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(Image)
    private imageRepository: Repository<Image>,
  ) {}

  /**
   * Checks if an image is available on the database and file system
   *
   * @param id - The id of the image to check for availability
   * @returns - Whether the image is available or not
   */
  public async isImageAvailable(id: number): Promise<boolean> {
    try {
      await this.findByIdOrFail(id);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Finds an image by its id in the database or throws a NotFoundException if
   * not found.
   *
   * @async
   * @param id - The id of the image to find.
   * @returns - The found image.
   * @throws {NotFoundException} - If the image with the specified id is not
   *   found.
   */
  public async findByIdOrFail(id: number): Promise<Image> {
    const image = await this.imageRepository
      .findOneByOrFail({ id })
      .catch(() => {
        throw new NotFoundException(
          `Image with id ${id} was not found in the database.`,
        );
      });

    if (!fs.existsSync(image.path) && !configuration.TESTING.MOCK_FILES) {
      await this.deleteImageById(image.id);
      throw new NotFoundException(
        `Image with id ${image.id} was found in the database but not on the server's filesystem (${image.path}), so it was soft-deleted.`,
      );
    }
    return image;
  }

  /**
   * Downloads an image from the given URL and returns a Promise that resolves
   * to the saved Image object.
   *
   * @param sourceUrl - The URL of the image to download.
   * @returns - A Promise that resolves to the saved Image object.
   * @throws {UnprocessableEntityException} - If the image is not available or
   *   could not be downloaded.
   * @throws {InternalServerErrorException} - If the image is not available or
   *   could not be downloaded.
   */
  async downloadImage(sourceUrl: string): Promise<Image> {
    const image = new Image();
    image.source = sourceUrl;
    image.path = `${configuration.VOLUMES.IMAGES}/${randomUUID()}`;

    try {
      this.logger.debug(`Downloading image from '${image.source}'`);
      const response = await firstValueFrom(
        this.httpService
          .get(image.source, {
            responseType: "arraybuffer",
            timeout: 30000,
          })
          .pipe(
            catchError((error: AxiosError) => {
              throw new Error(
                `Failed to download image from ${image.source}: ${error.status} ${error.message}`,
              );
            }),
          ),
      );

      // Check Media Type
      image.mediaType = response.headers["content-type"];
      if (!image.mediaType.startsWith("image/")) {
        throw new UnprocessableEntityException(
          `Content Type '${image.mediaType}' is not a known image data type. Please choose a valid image.`,
        );
      }

      // Download Image
      this.logger.debug(`Buffering image from '${image.source}'...`);
      const imageBuffer = Buffer.from(response.data);

      // Compress Image
      this.logger.debug(`Compressing image from '${image.source}'...`);
      const compressedImageBuffer = await sharp(imageBuffer).toBuffer();

      // Save the Image
      this.logger.debug(`Saving image from '${image.source}'...`);
      if (!configuration.TESTING.MOCK_FILES) {
        fs.writeFileSync(image.path, compressedImageBuffer);
        this.logger.debug(
          `Saved image from '${image.source} to '${image.path}'`,
        );
      } else {
        this.logger.warn(
          "Not saving any image to filesystem because TESTING_MOCK_FILES is set to true",
        );
      }
      return await this.imageRepository.save(image);
    } catch (error) {
      logger.error(
        { image, error },
        "Failed to download image. Clearing Remains.",
      );
      if (image.id) {
        await this.deleteImageById(image.id);
      }
      throw new UnprocessableEntityException(
        `Failed to download image from '${sourceUrl}.'`,
      );
    }
  }

  /** Soft deletes an image from the database and on the file system by its id */
  async deleteImageById(id: number) {
    try {
      const image = await this.imageRepository.findOneOrFail({
        where: { id },
        withDeleted: true,
      });
      await this.imageRepository.softRemove(image);
      this.logger.debug(
        { imageId: image.id, path: image.path, deletedAt: image.deleted_at },
        `Image successfully soft-deleted from database.`,
      );
      fs.unlinkSync(image.path);
      this.logger.debug(
        { imageId: image.id, path: image.path, deletedAt: image.deleted_at },
        `Image successfully hard deleted from file system.`,
      );
    } catch (error) {
      this.logger.error(error, `Failed to hard delete image from database`);
    }
  }
}
