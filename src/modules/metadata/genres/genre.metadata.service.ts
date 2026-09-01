import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { DEFAULT_METADATA_OPTIONS, type FindOptions, toFindOptionsRelations } from "../../../globals.js";
import { GenreMetadata } from "./genre.metadata.entity.js";

@Injectable()
export class GenreMetadataService {
  private readonly logger = new Logger(this.constructor.name);
  constructor(
    @InjectRepository(GenreMetadata)
    private readonly genreRepository: Repository<GenreMetadata>,
  ) {}

  async findByProviderSlug(
    provider_slug: string = "gamevault",
    options: FindOptions = DEFAULT_METADATA_OPTIONS,
  ): Promise<GenreMetadata[]> {
    let relationPaths: string[] = [];

    if (options.loadRelations) {
      if (options.loadRelations === true) {
        relationPaths = ["games"];
      } else if (Array.isArray(options.loadRelations))
        relationPaths = options.loadRelations;
    }

    const relations =
      relationPaths.length > 0
        ? toFindOptionsRelations<GenreMetadata>(relationPaths)
        : undefined;

    return this.genreRepository.find({
      where: { provider_slug },
      relations,
      withDeleted: options.loadDeletedEntities,
      relationLoadStrategy: "query",
    });
  }

  async save(genre: GenreMetadata): Promise<GenreMetadata> {
    const existingGenre = await this.genreRepository.findOneBy({
      provider_slug: genre.provider_slug,
      provider_data_id: genre.provider_data_id,
    });
    this.logger.debug({
      message: "Saving genre metadata",
      genre,
      already_exists: !!genre,
    });
    return this.genreRepository.save({
      ...existingGenre,
      provider_data_id: genre.provider_data_id,
      provider_slug: genre.provider_slug,
      name: genre.name,
    });
  }
}
