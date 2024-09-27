import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { FindOptions } from "../../../globals";
import { GenreMetadata } from "./genre.metadata.entity";

@Injectable()
export class GenreMetadataService {
  private readonly logger = new Logger(this.constructor.name);
  constructor(
    @InjectRepository(GenreMetadata)
    private readonly genreRepository: Repository<GenreMetadata>,
  ) {}

  async findByProviderSlug(
    provider_slug: string = "gamevault",
    options: FindOptions = { loadDeletedEntities: false, loadRelations: false },
  ): Promise<GenreMetadata[]> {
    let relations = [];

    if (options.loadRelations) {
      if (options.loadRelations === true) {
        relations = ["games"];
      } else if (Array.isArray(options.loadRelations))
        relations = options.loadRelations;
    }

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
    return this.genreRepository.save({
      ...existingGenre,
      ...{
        provider_data_id: genre.provider_data_id,
        provider_slug: genre.provider_slug,
        name: genre.name,
      },
    });
  }
}
