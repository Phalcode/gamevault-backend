import {
  EventSubscriber,
  EntitySubscriberInterface,
  LoadEvent,
  EntityManager,
} from "typeorm";
import { Image } from "../database/entities/image.entity";
import { Logger } from "@nestjs/common";

@EventSubscriber()
export class ImageSubscriber implements EntitySubscriberInterface<Image> {
  private readonly logger = new Logger(ImageSubscriber.name);
  listenTo() {
    return Image;
  }

  afterLoad(entity: Image, event: LoadEvent<Image>) {
    this.updateLastAccessedAtIfNecessary(entity, event.manager);
  }

  /**
   * Update the `last_accessed_at` property of an image if it hasn't been
   * accessed in the last 24 hours.
   *
   * @param image - The image to update.
   * @param entityManager - The entity manager used to save the updated image.
   */
  updateLastAccessedAtIfNecessary(image: Image, entityManager: EntityManager) {
    const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
    if (Date.now() - image.last_accessed_at.getTime() >= ONE_DAY_IN_MS) {
      image.last_accessed_at = new Date();
      const updatedImage = entityManager.save(image);
      this.logger.debug(
        updatedImage,
        `Successfully updated image's last_accessed_at date.`,
      );
    }
  }
}
