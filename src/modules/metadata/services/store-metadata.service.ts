import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { DeletedEntitiesFilter } from "../../../filters/deleted-entities.filter";
import { FindOptions } from "../../../globals";
import { StoreMetadata } from "../entities/store-metadata.entity";

@Injectable()
export class StoreMetadataService {
  private readonly logger = new Logger(StoreMetadataService.name);
  constructor(
    @InjectRepository(StoreMetadata)
    private storeRepository: Repository<StoreMetadata>,
  ) {}

  async find(
    metadata_provider: string = "gamevault",
    options: FindOptions = { loadDeletedEntities: false, loadRelations: false },
  ): Promise<StoreMetadata[]> {
    let relations = [];

    if (options.loadRelations) {
      if (options.loadRelations === true) {
        relations = ["games"];
      } else if (Array.isArray(options.loadRelations))
        relations = options.loadRelations;
    }

    const stores = await this.storeRepository.find({
      where: { metadata_provider },
      relations,
      withDeleted: options.loadDeletedEntities,
      relationLoadStrategy: "query",
    });

    return DeletedEntitiesFilter.filterDeleted(stores) as StoreMetadata[];
  }
}
