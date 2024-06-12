import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { DeletedEntitiesFilter } from "../../../filters/deleted-entities.filter";
import { FindOptions } from "../../../globals";
import { DeveloperMetadata } from "../entities/developer-metadata.entity";

@Injectable()
export class DeveloperMetadataService {
  private readonly logger = new Logger(DeveloperMetadataService.name);
  constructor(
    @InjectRepository(DeveloperMetadata)
    private developerRepository: Repository<DeveloperMetadata>,
  ) {}

  async find(
    metadata_provider: string = "gamevault",
    options: FindOptions = { loadDeletedEntities: false, loadRelations: false },
  ): Promise<DeveloperMetadata[]> {
    let relations = [];

    if (options.loadRelations) {
      if (options.loadRelations === true) {
        relations = ["games"];
      } else if (Array.isArray(options.loadRelations))
        relations = options.loadRelations;
    }

    const developers = await this.developerRepository.find({
      where: { metadata_provider },
      relations,
      withDeleted: options.loadDeletedEntities,
      relationLoadStrategy: "query",
    });

    return DeletedEntitiesFilter.filterDeleted(
      developers,
    ) as DeveloperMetadata[];
  }
}
