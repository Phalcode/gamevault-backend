import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { DeletedEntitiesFilter } from "../../../filters/deleted-entities.filter";
import { FindOptions } from "../../../globals";
import { GenreMetadata } from "../entities/genre-metadata.entity";

@Injectable()
export class GenreMetadataService {
  private readonly logger = new Logger(GenreMetadata.name);
  constructor(
    @InjectRepository(GenreMetadata)
    private genreRepository: Repository<GenreMetadata>,
  ) {}

  async find(
    metadata_provider: string = "gamevault",
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
      where: { metadata_provider },
      relations,
      withDeleted: options.loadDeletedEntities,
      relationLoadStrategy: "query",
    });

    return DeletedEntitiesFilter.filterDeleted(genres) as GenreMetadata[];
  }
}
