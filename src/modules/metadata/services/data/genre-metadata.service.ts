import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Builder } from "builder-pattern";
import { Repository } from "typeorm";

import { GenreMetadata } from "../../entities/data/genre-metadata.entity";
import { MetadataProvider } from "../../entities/metadata-provider.entity";

@Injectable()
export class GenreMetadataService {
  private readonly logger = new Logger(GenreMetadata.name);
  constructor(
    @InjectRepository(GenreMetadata)
    private tagRepository: Repository<GenreMetadata>,
  ) {}

  /**
   * Returns the genre with the specified RAWG ID, creating a new genre if one
   * does not already exist.
   */
  async getOrCreate(
    name: string,
    metadata_provider: MetadataProvider,
    metadata_provider_id?: string,
  ): Promise<GenreMetadata> {
    const existingGenre = await this.tagRepository.findOneBy({ name });

    if (existingGenre) return existingGenre;

    const genre = this.tagRepository.save(
      Builder(GenreMetadata)
        .name(name)
        .metadata_provider(metadata_provider)
        .metadata_provider_id(metadata_provider_id)
        .build(),
    );
    this.logger.log({
      message: "Created new Genre.",
      genre,
    });
    return genre;
  }
}
