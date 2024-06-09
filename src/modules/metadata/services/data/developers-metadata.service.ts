import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Builder } from "builder-pattern";
import { Repository } from "typeorm";

import { DeveloperMetadata } from "../../entities/data/developer-metadata.entity";
import { MetadataProvider } from "../../entities/metadata-provider.entity";

@Injectable()
export class DeveloperMetadataService {
  private readonly logger = new Logger(DeveloperMetadataService.name);
  constructor(
    @InjectRepository(DeveloperMetadata)
    private developerRepository: Repository<DeveloperMetadata>,
  ) {}

  async getOrCreate(
    name: string,
    metadata_provider: MetadataProvider,
    metadata_provider_id?: string,
  ): Promise<DeveloperMetadata> {
    const existingDeveloper = await this.developerRepository.findOneBy({
      name,
    });

    if (existingDeveloper) return existingDeveloper;

    const developer = await this.developerRepository.save(
      Builder(DeveloperMetadata)
        .name(name)
        .metadata_provider(metadata_provider)
        .metadata_provider_id(metadata_provider_id)
        .build(),
    );
    this.logger.log({
      message: "Created new Developer.",
      developer,
    });
    return developer;
  }
}
