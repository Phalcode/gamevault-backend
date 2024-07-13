import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Builder } from "builder-pattern";
import { In, Repository } from "typeorm";

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

  async findByProviderSlug(
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
    return this.gameMetadataRepository.find({
      where: { provider_slug },
      relations,
      withDeleted: options.loadDeletedEntities,
      relationLoadStrategy: "query",
    });
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

    return this.gameMetadataRepository.find({
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

      return await this.gameMetadataRepository.findOneOrFail({
        where: { id },
        relations,
        withDeleted: options.loadDeletedEntities,
        relationLoadStrategy: "query",
      });
    } catch (error) {
      throw new NotFoundException(
        `GameMetadata with id ${id} was not found on the server.`,
        { cause: error },
      );
    }
  }

  async deleteByGameMetadataIdOrFail(id: number) {
    return this.gameMetadataRepository.remove(
      await this.findOneByGameMetadataIdOrFail(id),
    );
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
      .age_rating(game.age_rating)
      .title(game.title)
      .release_date(game.release_date)
      .description(game.description)
      .average_playtime(game.average_playtime)
      .cover(game.cover)
      .background(game.background)
      .screenshots(game.screenshots)
      .url_website(game.url_website)
      .rating(game.rating)
      .early_access(game.early_access);

    const upsertedDevelopers = [];
    if (game.developers?.length) {
      for (const developer of game.developers) {
        if (
          upsertedDevelopers.some(
            (upsertedDeveloper) =>
              upsertedDeveloper.provider_data_id ===
                developer.provider_data_id &&
              upsertedDeveloper.provider_slug === developer.provider_slug,
          )
        ) {
          continue;
        }
        upsertedDevelopers.push(
          await this.developerMetadataService.save(developer),
        );
      }
    }
    combinedGameMetadata.developers(upsertedDevelopers);

    const upsertedPublishers = [];
    if (game.publishers?.length) {
      for (const publisher of game.publishers) {
        if (
          upsertedPublishers.some(
            (upsertedPublisher) =>
              upsertedPublisher.provider_data_id ===
                publisher.provider_data_id &&
              upsertedPublisher.provider_slug === publisher.provider_slug,
          )
        ) {
          continue;
        }

        upsertedPublishers.push(
          await this.publisherMetadataService.save(publisher),
        );
      }
    }
    combinedGameMetadata.publishers(upsertedPublishers);

    const upsertedTags = [];
    if (game.tags?.length) {
      for (const tag of game.tags) {
        if (
          upsertedTags.some(
            (upsertedTag) =>
              upsertedTag.provider_data_id === tag.provider_data_id &&
              upsertedTag.provider_slug === tag.provider_slug,
          )
        ) {
          continue;
        }
        upsertedTags.push(await this.tagMetadataService.save(tag));
      }
    }
    combinedGameMetadata.tags(upsertedTags);

    const upsertedGenres = [];
    if (game.genres?.length) {
      for (const genre of game.genres) {
        if (
          upsertedGenres.some(
            (upsertedGenre) =>
              upsertedGenre.provider_data_id === genre.provider_data_id &&
              upsertedGenre.provider_slug === genre.provider_slug,
          )
        ) {
          continue;
        }
        upsertedGenres.push(await this.genreMetadataService.save(genre));
      }
    }
    combinedGameMetadata.genres(upsertedGenres);

    const upsertedGame = combinedGameMetadata.build();

    logger.debug({
      message: `Saving GameMetadata`,
      game: upsertedGame,
    });

    return this.gameMetadataRepository.save(upsertedGame);
  }
}
