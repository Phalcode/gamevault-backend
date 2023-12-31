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

  /**
   * Garbage collects unused images.
   *
   * This function checks if image garbage collection is disabled before
   * proceeding. It retrieves all images from the image repository and collects
   * the paths of used images dynamically. Then, it removes unused images from
   * the database and cleans up the file system. Finally, it logs the number of
   * deleted images from the database and file system.
   */
  @Cron(`*/${configuration.IMAGE.GC_INTERVAL_IN_MINUTES} * * * *`)
  async garbageCollectUnusedImages() {
    // Check if image garbage collection is disabled
    if (configuration.IMAGE.GC_DISABLED) {
      // Log warning and skip garbage collection
      this.logger.warn(
        "Skipping image garbage collection because GC_DISABLED is set to true",
      );
      return;
    }

    // Retrieve all images from the image repository
    const allImages = await this.imageRepository.find();

    // Collect paths of used images dynamically
    const usedImagePaths = new Set<string>();
    await this.collectUsedImagePathsDynamically(usedImagePaths);

    // Remove unused images from the database
    const dbRemovedCount = await this.removeUnusedImagesFromDB(
      allImages,
      usedImagePaths,
    );

    // Clean up the file system
    const fsRemovedCount = await this.cleanupFileSystem(usedImagePaths);

    // Log the number of deleted images from the database and file system
    this.logger.log(
      `Deleted ${dbRemovedCount} unused images from the database.`,
    );
    this.logger.log(
      `Deleted ${fsRemovedCount} unused image files from ${configuration.VOLUMES.IMAGES}`,
    );
  }

  /**
   * Collects the used image paths dynamically from various repositories and
   * properties.
   *
   * @param usedImagePaths - Set that will store the used image paths.
   */
  private async collectUsedImagePathsDynamically(
    usedImagePaths: Set<string>,
  ): Promise<void> {
    // Define an array of objects, each containing a repository and the properties to check for images
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

    // Iterate over each object in the entityImageProperties array
    for (const { repository, properties } of entityImageProperties) {
      // Fetch all entities from the repository
      const entities = await repository.find();

      // Iterate over each entity
      for (const entity of entities) {
        // Iterate over each property in the properties array
        for (const property of properties) {
          // Get the image from the entity's property
          const image = entity[property];
          // If the image has a path, add it to the usedImagePaths set
          if (image?.path) {
            usedImagePaths.add(image.path);
          }
        }
      }
    }
  }

  /**
   * Removes unused images from the database.
   *
   * @param allImages - An array of all images in the database.
   * @param usedImagePaths - A set of image paths that are currently being used.
   * @returns The number of images deleted.
   */
  private async removeUnusedImagesFromDB(
    allImages: Image[],
    usedImagePaths: Set<string>,
  ): Promise<number> {
    // Filter out images that are not being used
    const unusedImages = allImages.filter(
      (image) => !usedImagePaths.has(image.path),
    );

    // Create an array of promises to delete the unused images
    const deletePromises = unusedImages.map((image) =>
      this.imagesService.delete(image),
    );

    // Wait for all the delete promises to resolve
    await Promise.all(deletePromises);

    // Return the number of images deleted
    return deletePromises.length;
  }

  /**
   * Cleans up the file system by removing unused files.
   *
   * @param usedImagePaths - A Set of paths to used image files.
   * @returns The number of files removed.
   */
  private async cleanupFileSystem(
    usedImagePaths: Set<string>,
  ): Promise<number> {
    // Skip garbage collection if TESTING_MOCK_FILES is true
    if (configuration.TESTING.MOCK_FILES) {
      this.logger.warn(
        "Skipping garbage collection because TESTING_MOCK_FILES is true.",
      );
      return 0;
    }

    // Get the directory where the image files are stored
    const imagesDirectory = configuration.VOLUMES.IMAGES;

    // Get a list of all files in the directory
    const allFiles = await readdir(imagesDirectory);

    let removedCount = 0;

    // Create an array of unlink promises for each file
    const unlinkPromises = allFiles.map((fileName) => {
      const filePath = join(imagesDirectory, fileName);

      // If the file path is not in the usedImagePaths set, delete the file
      if (!usedImagePaths.has(filePath)) {
        return unlink(filePath)
          .then(() => {
            this.logger.debug(`Garbage collected unused image: ${filePath}`);
            removedCount++;
          })
          .catch((error) => {
            this.logger.error(
              `Error deleting unused image ${filePath}: ${error}`,
            );
          });
      }

      return Promise.resolve();
    });

    // Wait for all unlink promises to resolve
    await Promise.all(unlinkPromises);

    return removedCount;
  }
}
