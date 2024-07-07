import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Builder } from "builder-pattern";
import { In, Repository } from "typeorm";

import { DeletedEntitiesFilter } from "../../../filters/deleted-entities.filter";
import { FindOptions } from "../../../globals";
import logger from "../../../logging";
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
      where: { provider_slug },
      relations,
      withDeleted: options.loadDeletedEntities,
      relationLoadStrategy: "query",
    });
    return DeletedEntitiesFilter.filterDeleted(games) as GameMetadata[];
  }

  async findByGameId(
    gameId: number,
    options: FindOptions = { loadDeletedEntities: false, loadRelations: true },
  ): Promise<GameMetadata[]> {
    let relations = [];
    if (options.loadRelations) {
      if (options.loadRelations === true) {
        relations = [
          "gamevault_games",
          "developers",
          "publishers",
          "genres",
          "tags",
        ];
      } else if (Array.isArray(options.loadRelations)) {
        relations = options.loadRelations;
      }
    }

    return await this.gameMetadataRepository.find({
      where: {
        gamevault_games: {
          id: In([gameId]),
        },
      },
      relations,
      withDeleted: options.loadDeletedEntities,
    });
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

  /**
   * Upserts a GameMetadata entity.
   *
   * If a GameMetadata with the same provider_slug and provider_data_id
   * exists, it updates its properties with the ones from the provided
   * metadata. Otherwise, it creates a new GameMetadata entity.
   */
  async save(game: GameMetadata): Promise<GameMetadata> {
    const existingGame = await this.gameMetadataRepository.findOneBy({
      provider_slug: game.provider_slug,
      provider_data_id: game.provider_data_id,
    });

    const combinedGameMetadata = Builder<GameMetadata>()
      .id(existingGame?.id)
      .provider_slug(game.provider_slug)
      .provider_data_id(game.provider_data_id)
      .provider_probability(game.provider_probability)
      .provider_checksum(game.provider_checksum)
      .age_rating(game.age_rating)
      .title(game.title)
      .release_date(game.release_date)
      .average_playtime(game.average_playtime)
      .cover(game.cover)
      .background(game.background)
      .screenshots(game.screenshots)
      .url_website(game.url_website)
      .rating_provider(game.rating_provider)
      .early_access(game.early_access);

    if (game.developers?.length) {
      const upsertedDevelopers = [];
      for (const developer of game.developers) {
        upsertedDevelopers.push(
          await this.developerMetadataService.save(developer),
        );
      }
      combinedGameMetadata.developers(upsertedDevelopers);
    }

    if (game.publishers?.length) {
      const upsertedPublishers = [];
      for (const publisher of game.publishers) {
        upsertedPublishers.push(
          await this.publisherMetadataService.save(publisher),
        );
      }
      combinedGameMetadata.publishers(upsertedPublishers);
    }

    if (game.tags?.length) {
      const upsertedTags = [];
      for (const tag of game.tags) {
        upsertedTags.push(await this.tagMetadataService.save(tag));
      }
      combinedGameMetadata.tags(upsertedTags);
    }

    if (game.genres?.length) {
      const upsertedGenres = [];
      for (const genre of game.genres) {
        upsertedGenres.push(await this.genreMetadataService.save(genre));
      }
      combinedGameMetadata.genres(upsertedGenres);
    }

    const upsertedGame = combinedGameMetadata.build();

    logger.log({
      message: `Upserted GameMetadata`,
      game: upsertedGame,
    });

    return await this.gameMetadataRepository.save(upsertedGame);
  }
}
