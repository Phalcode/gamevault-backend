import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Builder } from "builder-pattern";
import { Repository } from "typeorm";

import { PublisherMetadata } from "../../entities/data/publisher-metadata.entity";
import { MetadataProvider } from "../../entities/metadata-provider.entity";

@Injectable()
export class PublisherMetadataService {
  private readonly logger = new Logger(PublisherMetadataService.name);
  constructor(
    @InjectRepository(PublisherMetadata)
    private publisherRepository: Repository<PublisherMetadata>,
  ) {}

  /**
   * Returns the publisher with the specified RAWG ID, creating a new publisher
   * if one does not already exist.
   */
  async getOrCreate(
    name: string,
    metadata_provider: MetadataProvider,
    metadata_provider_id?: string,
  ): Promise<PublisherMetadata> {
    const existingPublisher = await this.publisherRepository.findOneBy({
      name,
    });

    if (existingPublisher) return existingPublisher;

    const publisher = await this.publisherRepository.save(
      Builder(PublisherMetadata)
        .name(name)
        .metadata_provider(metadata_provider)
        .metadata_provider_id(metadata_provider_id)
        .build(),
    );
    this.logger.log({
      message: "Created new Publisher.",
      publisher,
    });
    return publisher;
  }
}
