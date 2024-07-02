import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { DeletedEntitiesFilter } from "../../../filters/deleted-entities.filter";
import { FindOptions } from "../../../globals";
import { GenreMetadata } from "./genre.metadata.entity";

@Injectable()
export class GenreMetadataService {
  private readonly logger = new Logger(this.constructor.name);
  constructor(
    @InjectRepository(GenreMetadata)
    private genreRepository: Repository<GenreMetadata>,
  ) {}

  async find(
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

    const genres = await this.genreRepository.find({
      where: { provider_slug: provider_slug },
      relations,
      withDeleted: options.loadDeletedEntities,
      relationLoadStrategy: "query",
    });

    return DeletedEntitiesFilter.filterDeleted(genres) as GenreMetadata[];
  }

  async upsert(genre: GenreMetadata): Promise<GenreMetadata> {
    const existingGenre = await this.genreRepository.findOne({
      where: {
        provider_slug: genre.provider_slug,
        provider_data_id: genre.provider_data_id,
      },
    });

    return this.genreRepository.save({
      ...existingGenre,
      ...genre,
    });
  }
}
