import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Builder } from "builder-pattern";
import { Repository } from "typeorm";

import { StoreMetadata } from "../../entities/data/store-metadata.entity";
import { MetadataProvider } from "../../entities/metadata-provider.entity";

@Injectable()
export class StoreMetadataService {
  private readonly logger = new Logger(StoreMetadataService.name);
  constructor(
    @InjectRepository(StoreMetadata)
    private storeRepository: Repository<StoreMetadata>,
  ) {}

  /**
   * Returns the store with the specified RAWG ID, creating a new store if one
   * does not already exist.
   */
  async getOrCreate(
    name: string,
    metadata_provider: MetadataProvider,
    metadata_provider_id?: string,
  ): Promise<StoreMetadata> {
    const existingStore = await this.storeRepository.findOneBy({ name });

    if (existingStore) return existingStore;

    const store = await this.storeRepository.save(
      Builder(StoreMetadata)
        .name(name)
        .metadata_provider(metadata_provider)
        .metadata_provider_id(metadata_provider_id)
        .build(),
    );
    this.logger.log({
      message: "Created new Store.",
      store,
    });
    return store;
  }
}
