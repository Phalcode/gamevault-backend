import {
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Image } from "../database/entities/image.entity";
import * as fs from "fs";
import configuration from "../configuration";
import sharp from "sharp";
import logger from "../logging";
import { CrackpipeUser } from "../database/entities/crackpipe-user.entity";
import { Game } from "../database/entities/game.entity";
import { HttpService } from "@nestjs/axios";
import { catchError, firstValueFrom } from "rxjs";
import { AxiosError } from "axios";
import { randomUUID } from "crypto";

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(
    @InjectRepository(Image)
    private imageRepository: Repository<Image>,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Checks if an image is available on the file system
   *
   * @param image - The image object to check for availability
   * @returns - Whether the image is available or not
   */
  public imageIsAvailableOnFileSystem(image: Image): boolean {
    if (image?.path) {
      if (fs.existsSync(image.path) || configuration.TESTING.MOCK_FILES) {
        return true;
      }
    }
    return false;
  }

  /**
   * Finds an image by its source URL, or downloads it if it doesn't exist
   *
   * @param sourceUrl - The source URL of the image
   * @returns - A Promise that resolves to the found or downloaded image
   */
  public async findBySourceUrlOrDownload(sourceUrl: string): Promise<Image> {
    const existingImage = await this.imageRepository.findOne({
      where: {
        source: sourceUrl,
      },
      withDeleted: true,
    });

    if (this.imageIsAvailableOnFileSystem(existingImage)) {
      if (existingImage.deleted_at) {
        await this.imageRepository.recover(existingImage);
      }
      return existingImage;
    } else if (existingImage?.id) {
      logger.warn(
        "Image was found in the database but not on the server's filesystem. Clearing Remains.",
        existingImage,
      );
      await this.hardDeleteImageById(existingImage.id);
    }

    return this.downloadImage(sourceUrl);
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

    if (!fs.existsSync(image.path)) {
      await this.softDeleteImageById(image.id);
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
  private async downloadImage(sourceUrl: string): Promise<Image> {
    const image = new Image();
    image.last_accessed_at = new Date();
    image.source = sourceUrl;
    image.path = `${configuration.IMAGE.STORAGE_PATH}/${randomUUID()}`;

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
          `Content Type Header '${image.mediaType}' is not a known image data type. Please choose a valid image.`,
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
        await this.hardDeleteImageById(image.id);
      }
      throw new UnprocessableEntityException(
        `Failed to download image from '${sourceUrl}.'`,
      );
    }
  }

  /**
   * Asynchronously soft deletes an image from the database and using
   * image.entity.subscriber.ts on the file system by its id
   */
  async softDeleteImageById(id: number) {
    try {
      const image = await this.imageRepository.findOneOrFail({
        where: { id },
        withDeleted: true,
      });
      await this.imageRepository.softRemove(image);
      this.logger.debug(
        { imageId: image.id, path: image.path, deletedAt: image.deleted_at },
        `Image successfully soft deleted from database.`,
      );
    } catch (error) {
      this.logger.error(error, `Failed to soft delete image from database`);
    }
  }

  /**
   * Asynchronously hard deletes an image from the database and using
   * image.entity.subscriber.ts on the file system by its id
   */
  async hardDeleteImageById(id: number) {
    try {
      const image = await this.imageRepository.findOneOrFail({
        where: { id },
        withDeleted: true,
      });
      await this.imageRepository.remove(image);
      this.logger.debug(
        { imageId: image.id, path: image.path, deletedAt: image.deleted_at },
        `Image successfully hard deleted from database.`,
      );
    } catch (error) {
      this.logger.error(error, `Failed to hard delete image from database`);
    }
  }

  /**
   * Asynchronously garbage collects images that are no longer in use and are
   * older than a specified number of days. Images are considered "in use" if
   * they are associated with a game or a user profile picture or background
   * image.
   */
  async garbageCollectImagesInDatabase(): Promise<void> {
    logger.log("Starting database image garbage collection...");

    const unfilteredImagesToDelete: Image[] = await this.imageRepository
      .createQueryBuilder("image")
      .leftJoin(
        Game,
        "game",
        "game.box_image_id = image.id OR game.background_image_id = image.id",
      )
      .leftJoin(
        CrackpipeUser,
        "crackpipe_user",
        "crackpipe_user.profile_picture_id = image.id OR crackpipe_user.background_image_id = image.id",
      )
      .where(
        "game.box_image_id IS NULL AND game.background_image_id IS NULL AND crackpipe_user.profile_picture_id IS NULL AND crackpipe_user.background_image_id IS NULL",
      )
      .select("image.id, image.last_accessed_at")
      .getRawMany();

    const now = new Date();
    const daysAgo = new Date(
      now.getTime() - configuration.IMAGE.GC_KEEP_DAYS * 24 * 60 * 60 * 1000,
    );
    const imagesToDelete = unfilteredImagesToDelete.filter((image) => {
      return new Date(image.last_accessed_at) < daysAgo;
    });

    if (imagesToDelete.length === 0) {
      logger.log("No images to delete!");
      return;
    }

    logger.log(`Deleting ${imagesToDelete.length} images...`);
    for (const image of imagesToDelete) {
      await this.softDeleteImageById(image.id);
    }

    logger.log("Finished database image garbage collection.");
  }
}
