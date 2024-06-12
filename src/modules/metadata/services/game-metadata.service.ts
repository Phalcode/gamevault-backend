import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { DeletedEntitiesFilter } from "../../../filters/deleted-entities.filter";
import { FindOptions } from "../../../globals";
import { GameMetadata } from "../entities/game-metadata.entity";

@Injectable()
export class GameMetadataService {
  constructor(
    @InjectRepository(GameMetadata)
    private gameMetadataRepository: Repository<GameMetadata>,
  ) {}

  async find(
    metadata_provider: string = "gamevault",
    options: FindOptions = { loadDeletedEntities: false, loadRelations: false },
  ): Promise<GameMetadata[]> {
    let relations = [];

    if (options.loadRelations) {
      if (options.loadRelations === true) {
        relations = ["developers", "publishers", "genres", "stores", "tags"];
      } else if (Array.isArray(options.loadRelations))
        relations = options.loadRelations;
    }
    const games = await this.gameMetadataRepository.find({
      where: { metadata_provider },
      relations,
      withDeleted: options.loadDeletedEntities,
      relationLoadStrategy: "query",
    });
    return DeletedEntitiesFilter.filterDeleted(games) as GameMetadata[];
  }

  async findOneByGameMetadataIdOrFail(
    id: number,
    options: FindOptions = { loadDeletedEntities: false, loadRelations: false },
  ): Promise<GameMetadata> {
    try {
      let relations = [];

      if (options.loadRelations) {
        if (options.loadRelations === true) {
          relations = ["developers", "publishers", "genres", "stores", "tags"];
        } else if (Array.isArray(options.loadRelations))
          relations = options.loadRelations;
      }

      const game = await this.gameMetadataRepository.findOneOrFail({
        where: { id },
        relations,
        withDeleted: options.loadDeletedEntities,
        relationLoadStrategy: "query",
      });
      return DeletedEntitiesFilter.filterDeleted(game) as GameMetadata;
    } catch (error) {
      throw new NotFoundException(
        `GameMetadata with id ${id} was not found on the server.`,
        { cause: error },
      );
    }
  }
}
