import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import {
  DEFAULT_METADATA_OPTIONS,
  type FindOptions,
  toFindOptionsRelations,
} from "../../../globals.js";
import { TagMetadata } from "./tag.metadata.entity.js";

@Injectable()
export class TagMetadataService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectRepository(TagMetadata)
    private readonly tagRepository: Repository<TagMetadata>,
  ) {}

  async findByProviderSlug(
    provider_slug: string = "gamevault",
    options: FindOptions = DEFAULT_METADATA_OPTIONS,
  ): Promise<TagMetadata[]> {
    let relationPaths: string[] = [];

    if (options.loadRelations) {
      if (options.loadRelations === true) {
        relationPaths = ["games"];
      } else if (Array.isArray(options.loadRelations))
        relationPaths = options.loadRelations;
    }

    const relations =
      relationPaths.length > 0
        ? toFindOptionsRelations<TagMetadata>(relationPaths)
        : undefined;

    return this.tagRepository.find({
      where: { provider_slug },
      relations,
      withDeleted: options.loadDeletedEntities,
      relationLoadStrategy: "query",
    });
  }

  async save(tag: TagMetadata): Promise<TagMetadata> {
    const existingTag = await this.tagRepository.findOneBy({
      provider_slug: tag.provider_slug,
      provider_data_id: tag.provider_data_id,
    });
    this.logger.debug({
      message: "Saving tag metadata",
      tag,
      already_exists: !!tag,
    });
    return this.tagRepository.save({
      ...existingTag,
      provider_data_id: tag.provider_data_id,
      provider_slug: tag.provider_slug,
      name: tag.name,
    });
  }
}
