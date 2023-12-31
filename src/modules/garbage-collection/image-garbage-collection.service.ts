import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Game } from "../games/game.entity";
import { GamevaultUser } from "../users/gamevault-user.entity";
import { Image } from "../images/image.entity";
import configuration from "../../configuration";
import { Cron } from "@nestjs/schedule";
import { join } from "path";
import { ImagesService } from "../images/images.service";
import { readdir, unlink } from "fs/promises";

@Injectable()
export class ImageGarbageCollectionService {
  private readonly logger = new Logger(ImageGarbageCollectionService.name);

  constructor(
    @InjectRepository(Image)
    private imageRepository: Repository<Image>,
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,
    @InjectRepository(GamevaultUser)
    private userRepository: Repository<GamevaultUser>,
    private imagesService: ImagesService,
  ) {
    this.garbageCollectUnusedImages();
  }

  @Cron(`*/${configuration.IMAGE.GC_INTERVAL_IN_MINUTES} * * * *`)
  async garbageCollectUnusedImages() {
    if (configuration.IMAGE.GC_DISABLED) {
      this.logger.warn(
        "Skipping image garbage collection because GC_DISABLED is set to true",
      );
      return;
    }

    const allImages = await this.imageRepository.find();
    const usedImagePaths = new Set<string>();
    await this.collectUsedImagePathsDynamically(usedImagePaths);

    const dbRemovedCount = await this.removeUnusedImagesFromDB(
      allImages,
      usedImagePaths,
    );
    const fsRemovedCount = await this.cleanupFileSystem(usedImagePaths);

    this.logger.log(
      `Deleted ${dbRemovedCount} unused images from the database.`,
    );
    this.logger.log(
      `Deleted ${fsRemovedCount} unused image files from ${configuration.VOLUMES.IMAGES}`,
    );
  }

  private async collectUsedImagePathsDynamically(
    usedImagePaths: Set<string>,
  ): Promise<void> {
    const entityImageProperties = [
      {
        repository: this.gameRepository,
        properties: ["background_image", "box_image"],
      },
      {
        repository: this.userRepository,
        properties: ["background_image", "profile_picture"],
      },
      // Add more repositories and image properties as needed
    ];

    for (const { repository, properties } of entityImageProperties) {
      const entities = await repository.find();

      for (const entity of entities) {
        for (const property of properties) {
          const image = entity[property];
          if (image?.path) {
            usedImagePaths.add(image.path);
          }
        }
      }
    }
  }

  private async removeUnusedImagesFromDB(
    allImages: Image[],
    usedImagePaths: Set<string>,
  ): Promise<number> {
    const deletePromises = allImages
      .filter((image) => !usedImagePaths.has(image.path))
      .map((image) => this.imagesService.delete(image));
    await Promise.all(deletePromises);
    return deletePromises.length;
  }

  private async cleanupFileSystem(
    usedImagePaths: Set<string>,
  ): Promise<number> {
    if (configuration.TESTING.MOCK_FILES) {
      this.logger.warn(
        "Skipping garbage collection because TESTING_MOCK_FILES is true.",
      );
      return 0;
    }

    const imagesDirectory = configuration.VOLUMES.IMAGES;
    const allFiles = await readdir(imagesDirectory);
    let removedCount = 0;

    const unlinkPromises = allFiles.map((fileName) => {
      const filePath = join(imagesDirectory, fileName);
      if (!usedImagePaths.has(filePath)) {
        return unlink(filePath)
          .then(() => {
            this.logger.debug(`Collected unused file: ${filePath}`);
            removedCount++;
          })
          .catch((error) => {
            this.logger.error(`Error deleting file ${filePath}: ${error}`);
          });
      }
      return Promise.resolve();
    });

    await Promise.all(unlinkPromises);
    return removedCount;
  }
}
