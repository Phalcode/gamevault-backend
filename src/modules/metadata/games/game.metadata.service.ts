import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { DeletedEntitiesFilter } from "../../../filters/deleted-entities.filter";
import { FindOptions } from "../../../globals";
import { DeveloperMetadataService } from "../developers/developer.metadata.service";
import { GenreMetadataService } from "../genres/genre.metadata.service";
import { PublisherMetadataService } from "../publishers/publisher.metadata.service";
import { TagMetadataService } from "../tags/tag.metadata.service";
import { GameMetadata } from "./game.metadata.entity";

@Injectable()
export class GameMetadataService {
  constructor(
    @InjectRepository(GameMetadata)
    private gameMetadataRepository: Repository<GameMetadata>,
    private developerMetadataService: DeveloperMetadataService,
    private publisherMetadataService: PublisherMetadataService,
    private tagMetadataService: TagMetadataService,
    private genreMetadataService: GenreMetadataService,
  ) {}

  async find(
    provider_slug: string = "gamevault",
    options: FindOptions = { loadDeletedEntities: false, loadRelations: false },
  ): Promise<GameMetadata[]> {
    let relations = [];

    if (options.loadRelations) {
      if (options.loadRelations === true) {
        relations = ["developers", "publishers", "genres", "tags"];
      } else if (Array.isArray(options.loadRelations))
        relations = options.loadRelations;
    }
    const games = await this.gameMetadataRepository.find({
      where: { provider_slug: provider_slug },
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
          relations = ["developers", "publishers", "genres", "tags"];
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

  async upsert(game: GameMetadata): Promise<GameMetadata> {
    const existingGameMetadata = await this.gameMetadataRepository.findOne({
      where: {
        provider_slug: game.provider_slug,
        provider_data_id: game.provider_data_id,
      },
      relations: ["developers", "publishers", "genres", "tags"],
    });

    const upsertedGame = {
      ...existingGameMetadata,
      ...game,
    } as GameMetadata;

    const finalGameMetadata = await this.upsertRelatedEntities(upsertedGame);

    return this.gameMetadataRepository.save(finalGameMetadata);
  }

  private async upsertRelatedEntities(game: GameMetadata) {
    game.developers = await Promise.all(
      game.developers.map(async (developer) => ({
        ...(await this.developerMetadataService.upsert(developer)),
      })),
    );
    game.publishers = await Promise.all(
      game.publishers.map(async (publisher) => ({
        ...(await this.publisherMetadataService.upsert(publisher)),
      })),
    );
    game.tags = await Promise.all(
      game.tags.map(async (tag) => ({
        ...(await this.tagMetadataService.upsert(tag)),
      })),
    );
    game.genres = await Promise.all(
      game.genres.map(async (genre) => ({
        ...(await this.genreMetadataService.upsert(genre)),
      })),
    );

    return game;
  }
}
