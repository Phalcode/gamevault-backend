import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { DeletedEntitiesFilter } from "../../../filters/deleted-entities.filter";
import { FindOptions } from "../../../globals";
import { PublisherMetadata } from "../entities/publisher-metadata.entity";

@Injectable()
export class PublisherMetadataService {
  private readonly logger = new Logger(PublisherMetadataService.name);
  constructor(
    @InjectRepository(PublisherMetadata)
    private publisherRepository: Repository<PublisherMetadata>,
  ) {}

  async find(
    metadata_provider: string = "gamevault",
    options: FindOptions = { loadDeletedEntities: false, loadRelations: false },
  ): Promise<PublisherMetadata[]> {
    let relations = [];

    if (options.loadRelations) {
      if (options.loadRelations === true) {
        relations = ["games"];
      } else if (Array.isArray(options.loadRelations))
        relations = options.loadRelations;
    }

    const publishers = await this.publisherRepository.find({
      where: { metadata_provider },
      relations,
      withDeleted: options.loadDeletedEntities,
      relationLoadStrategy: "query",
    });

    return DeletedEntitiesFilter.filterDeleted(
      publishers,
    ) as PublisherMetadata[];
  }

  async save(publisher: PublisherMetadata): Promise<PublisherMetadata> {
    return this.publisherRepository.save(publisher);
  }

  async delete(id: number): Promise<PublisherMetadata> {
    return await this.publisherRepository.softRemove({ id });
  }
}
