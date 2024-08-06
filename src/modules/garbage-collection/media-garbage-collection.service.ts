import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { isUUID } from "class-validator";
import { readdir, unlink } from "fs/promises";
import { join } from "path";
import { Repository } from "typeorm";

import configuration from "../../configuration";
import { Media } from "../media/media.entity";
import { MediaService } from "../media/media.service";
import { GameMetadata } from "../metadata/games/game.metadata.entity";
import { GamevaultUser } from "../users/gamevault-user.entity";

@Injectable()
export class MediaGarbageCollectionService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
    @InjectRepository(GameMetadata)
    private gameMetadataRepository: Repository<GameMetadata>,
    @InjectRepository(GamevaultUser)
    private userRepository: Repository<GamevaultUser>,
    private mediaService: MediaService,
  ) {
    this.garbageCollectUnusedMedia();
  }

  /**
   * Garbage collects unused medias.
   *
   * This function checks if media garbage collection is disabled before
   * proceeding. It retrieves all media from the media repository and collects
   * the paths of used media dynamically. Then, it removes unused media from
   * the database and cleans up the file system. Finally, it logs the number of
   * deleted media from the database and file system.
   */
  @Cron(`*/${configuration.MEDIA.GC_INTERVAL_IN_MINUTES} * * * *`)
  async garbageCollectUnusedMedia() {
    // Check if media garbage collection is disabled
    if (configuration.MEDIA.GC_DISABLED) {
      // Log warning and skip garbage collection
      this.logger.warn({
        message: "Skipping media garbage collection.",
        reason: "MEDIA_GC_DISABLED is set to true.",
      });
      return;
    }

    // Retrieve all media from the media repository
    const allMedia = await this.mediaRepository.find();

    // Collect paths of used media dynamically
    const usedMediaPaths = await this.collectUsedMediaPaths();

    // Remove unused media from the database
    const dbRemovedCount = await this.removeUnusedMediaFromDB(
      allMedia,
      usedMediaPaths,
    );

    // Clean up the file system
    const fsRemovedCount = await this.cleanupFileSystem(usedMediaPaths);

    // Log the number of deleted media from the database and file system (if any)
    if (dbRemovedCount) {
      this.logger.log(
        `Deleted ${dbRemovedCount} unused media from the database.`,
      );
    }

    if (fsRemovedCount) {
      this.logger.log(
        `Deleted ${fsRemovedCount} unused media files from ${configuration.VOLUMES.MEDIA}.`,
      );
    }
  }

  /**
   * Collects paths of used media dynamically.
   *
   * @returns An array of media paths that are currently being used.
   */
  private async collectUsedMediaPaths(): Promise<string[]> {
    const mediaPaths: string[] = [];
    /**
     * The entities and properties that are checked for media usage.
     * Each element in the array is an object with a `repository` property and a
     * `properties` property. The `repository` property is the TypeORM repository
     * instance for the entity. The `properties` property is an array of strings
     * representing the properties of the entity that may contain media.
     */
    const entityMediaProperties = [
      {
        repository: this.userRepository,
        properties: ["background", "avatar"],
      },
      {
        repository: this.gameMetadataRepository,
        properties: ["cover", "background"],
      },
    ];
    /**
     * Loop through the entities and their properties and find the media that is
     * being used.
     */
    for (const { repository, properties } of entityMediaProperties) {
      const entities = await repository.find({
        withDeleted: true,
        relations: properties,
        loadEagerRelations: false,
        relationLoadStrategy: "query",
      });
      for (const entity of entities) {
        const foundMedia: Media[] = [];
        /**
         * Loop through each property of the entity and check if it contains
         * media.
         */
        for (const property of properties) {
          if (Array.isArray(entity[property])) {
            foundMedia.push(...entity[property]);
          } else if (entity[property]) {
            foundMedia.push(entity[property]);
          }
        }
        /**
         * Add the media paths to the `mediaPaths` array.
         */
        mediaPaths.push(
          ...foundMedia
            .filter((media) => media.file_path)
            .map((media) => media.file_path),
        );
      }
    }
    return mediaPaths;
  }

  /**
   * Removes unused media from the database.
   *
   * @param allMedia - An array of all media in the database.
   * @param usedMediaPaths - A set of media paths that are currently being used.
   * @returns The number of media deleted.
   */
  private async removeUnusedMediaFromDB(
    allMedia: Media[],
    usedMediaPaths: string[],
  ): Promise<number> {
    // Filter out media that are not being used
    const unusedMedia = allMedia.filter(
      (media) => !usedMediaPaths.includes(media.file_path),
    );

    // Create an array of promises to delete the unused media
    const deletePromises = unusedMedia.map((media) =>
      this.mediaService.delete(media),
    );

    // Wait for all the delete promises to resolve
    await Promise.all(deletePromises);

    // Return the number of media deleted
    return deletePromises.length;
  }

  /**
   * Cleans up the file system by removing unused files.
   *
   * @param usedMediaPaths - A Set of paths to used media files.
   * @returns The number of files removed.
   */
  private async cleanupFileSystem(usedMediaPaths: string[]): Promise<number> {
    // Skip garbage collection if TESTING_MOCK_FILES is true
    if (configuration.TESTING.MOCK_FILES) {
      this.logger.warn({
        message: "Skipping media garbage collection.",
        reason: "TESTING_MOCK_FILES is true.",
      });
      return 0;
    }

    // Get a list of all media files in the directory
    const allMediaFilePaths = (
      await readdir(configuration.VOLUMES.MEDIA, {
        encoding: "utf8",
        withFileTypes: true,
        recursive: false,
      })
    )
      .filter((file) => file.isFile() && isUUID(file.name.substring(0, 35), 4))
      .map((file) => join(file.path, file.name));

    let removedCount = 0;

    // Create an array of unlink promises for each file
    const unlinkPromises = allMediaFilePaths.map((path) => {
      // If the file path is not in the usedMediaPaths set, delete the file
      if (!usedMediaPaths.includes(path)) {
        return unlink(path)
          .then(() => {
            this.logger.debug({
              message: "Garbage collected unused media.",
              path,
            });
            removedCount++;
          })
          .catch((error) => {
            this.logger.error({
              message: "Error garbage collecting unused media.",
              path,
              error,
            });
          });
      }

      return Promise.resolve();
    });

    // Wait for all unlink promises to resolve
    await Promise.all(unlinkPromises);

    return removedCount;
  }
}
