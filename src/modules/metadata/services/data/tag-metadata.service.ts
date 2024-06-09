import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Builder } from "builder-pattern";
import { Repository } from "typeorm";

import { TagMetadata } from "../../entities/data/tag-metadata.entity";
import { MetadataProvider } from "../../entities/metadata-provider.entity";

@Injectable()
export class TagMetadataService {
  private readonly logger = new Logger(TagMetadataService.name);

  constructor(
    @InjectRepository(TagMetadata)
    private tagRepository: Repository<TagMetadata>,
  ) {}

  /**
   * Returns the tag with the specified name, creating a new tag if one does not already exist.
   */
  async getOrCreate(
    name: string,
    metadata_provider: MetadataProvider,
    metadata_provider_id?: string,
  ): Promise<TagMetadata> {
    const existingTag = await this.tagRepository.findOneBy({ name });

    if (existingTag) return existingTag;

    const tag = await this.tagRepository.save(
      Builder(TagMetadata)
        .name(name)
        .metadata_provider(metadata_provider)
        .metadata_provider_id(metadata_provider_id)
        .build(),
    );

    this.logger.log({
      message: "Created new Tag.",
      tag,
    });
    return tag;
  }
}
