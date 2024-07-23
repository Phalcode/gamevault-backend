import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { FindOptions } from "../../../globals";
import { DeveloperMetadata } from "./developer.metadata.entity";

@Injectable()
export class DeveloperMetadataService {
  private readonly logger = new Logger(this.constructor.name);
  constructor(
    @InjectRepository(DeveloperMetadata)
    private developerRepository: Repository<DeveloperMetadata>,
  ) {}

  async findByProviderSlug(
    provider_slug: string = "gamevault",
    options: FindOptions = { loadDeletedEntities: false, loadRelations: false },
  ): Promise<DeveloperMetadata[]> {
    let relations = [];

    if (options.loadRelations) {
      if (options.loadRelations === true) {
        relations = ["games"];
      } else if (Array.isArray(options.loadRelations))
        relations = options.loadRelations;
    }

    return this.developerRepository.find({
      where: { provider_slug },
      relations,
      withDeleted: options.loadDeletedEntities,
      relationLoadStrategy: "query",
    });
  }

  async save(developer: DeveloperMetadata): Promise<DeveloperMetadata> {
    const existingDeveloper = await this.developerRepository.findOneBy({
      provider_slug: developer.provider_slug,
      provider_data_id: developer.provider_data_id,
      
    });
    return this.developerRepository.save({
      ...existingDeveloper,
      ...{
        provider_data_id: developer.provider_data_id,
        provider_slug: developer.provider_slug,
        name: developer.name,
      },
    });
  }
}
