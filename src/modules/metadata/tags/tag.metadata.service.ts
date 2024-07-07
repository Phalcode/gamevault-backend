import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { DeletedEntitiesFilter } from "../../../filters/deleted-entities.filter";
import { FindOptions } from "../../../globals";
import { TagMetadata } from "./tag.metadata.entity";

@Injectable()
export class TagMetadataService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectRepository(TagMetadata)
    private tagRepository: Repository<TagMetadata>,
  ) {}

  async find(
    provider_slug: string = "gamevault",
    options: FindOptions = { loadDeletedEntities: false, loadRelations: false },
  ): Promise<TagMetadata[]> {
    let relations = [];

    if (options.loadRelations) {
      if (options.loadRelations === true) {
        relations = ["games"];
      } else if (Array.isArray(options.loadRelations))
        relations = options.loadRelations;
    }

    const tags = await this.tagRepository.find({
      where: { provider_slug },
      relations,
      withDeleted: options.loadDeletedEntities,
      relationLoadStrategy: "query",
    });

    return DeletedEntitiesFilter.filterDeleted(tags) as TagMetadata[];
  }

  async save(tag: TagMetadata): Promise<TagMetadata> {
    const existingTag = await this.tagRepository.findOneBy({
      provider_slug: tag.provider_slug,
      provider_data_id: tag.provider_data_id,
    });
    return this.tagRepository.save({
      ...existingTag,
      ...{
        provider_data_id: tag.provider_data_id,
        provider_slug: tag.provider_slug,
        name: tag.name,
      },
    });
  }
}
