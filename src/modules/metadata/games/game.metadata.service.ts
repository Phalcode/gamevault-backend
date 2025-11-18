import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { FindOptions } from "../../../globals";
import logger from "../../../logging";
import { DeveloperMetadata } from "../developers/developer.metadata.entity";
import { DeveloperMetadataService } from "../developers/developer.metadata.service";
import { GenreMetadata } from "../genres/genre.metadata.entity";
import { GenreMetadataService } from "../genres/genre.metadata.service";
import { PublisherMetadata } from "../publishers/publisher.metadata.entity";
import { PublisherMetadataService } from "../publishers/publisher.metadata.service";
import { TagMetadata } from "../tags/tag.metadata.entity";
import { TagMetadataService } from "../tags/tag.metadata.service";
import { GameMetadata } from "./game.metadata.entity";

@Injectable()
export class GameMetadataService {
  constructor(
    @InjectRepository(GameMetadata)
    private readonly gameMetadataRepository: Repository<GameMetadata>,
    private readonly developerMetadataService: DeveloperMetadataService,
    private readonly publisherMetadataService: PublisherMetadataService,
    private readonly tagMetadataService: TagMetadataService,
    private readonly genreMetadataService: GenreMetadataService,
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
    const existingMetadata = await this.gameMetadataRepository.findOne({
      where: {
        provider_slug: game.provider_slug,
        provider_data_id: game.provider_data_id,
      },
      relationLoadStrategy: "query",
    });

    const upsertedGame: Required<GameMetadata> = {
      id: existingMetadata?.id,
      created_at: undefined,
      updated_at: undefined,
      deleted_at: undefined,
      entity_version: undefined,
      provider_slug: game.provider_slug,
      provider_data_id: game.provider_data_id,
      provider_data_url: game.provider_data_url,
      provider_priority: game.provider_priority,
      age_rating: game.age_rating,
      title: game.title,
      release_date: game.release_date,
      description: game.description,
      notes: game.notes,
      average_playtime: game.average_playtime,
      cover: game.cover,
      background: game.background,
      url_screenshots: game.url_screenshots,
      url_trailers: game.url_trailers,
      url_gameplays: game.url_gameplays,
      url_websites: game.url_websites,
      rating: game.rating,
      early_access: game.early_access,
      launch_parameters: game.launch_parameters,
      launch_executable: game.launch_executable,
      installer_parameters: game.installer_parameters,
      installer_executable: game.installer_executable,
      uninstaller_parameters: game.uninstaller_parameters,
      uninstaller_executable: game.uninstaller_executable,
      publishers: null,
      developers: null,
      tags: null,
      genres: null,
    };

    if (game.developers?.length) {
      const upsertedDevelopers: DeveloperMetadata[] = [];
      for (const developer of game.developers) {
        try {
          if (
            !upsertedDevelopers.find(
              (upsertedDeveloper) =>
                upsertedDeveloper.provider_slug === developer.provider_slug &&
                upsertedDeveloper.provider_data_id ===
                  developer.provider_data_id,
            )
          ) {
            upsertedDevelopers.push(
              await this.developerMetadataService.save(developer),
            );
          }
        } catch (error) {
          logger.error({
            message: `Error upserting developer metadata`,
            error,
            developer,
          });
        }
      }
      upsertedGame.developers = upsertedDevelopers;
    }

    if (game.publishers?.length) {
      const upsertedPublishers: PublisherMetadata[] = [];
      for (const publisher of game.publishers) {
        try {
          if (
            !upsertedPublishers.find(
              (upsertedPublisher) =>
                upsertedPublisher.provider_slug === publisher.provider_slug &&
                upsertedPublisher.provider_data_id ===
                  publisher.provider_data_id,
            )
          ) {
            upsertedPublishers.push(
              await this.publisherMetadataService.save(publisher),
            );
          }
        } catch (error) {
          logger.error({
            message: `Error upserting publisher metadata`,
            error,
            publisher,
          });
        }
      }
      upsertedGame.publishers = upsertedPublishers;
    }

    if (game.tags?.length) {
      const upsertedTags: TagMetadata[] = [];
      for (const tag of game.tags) {
        try {
          if (
            !upsertedTags.find(
              (upsertedTag) =>
                upsertedTag.provider_slug === tag.provider_slug &&
                upsertedTag.provider_data_id === tag.provider_data_id,
            )
          ) {
            upsertedTags.push(await this.tagMetadataService.save(tag));
          }
        } catch (error) {
          logger.error({
            message: `Error upserting tag metadata`,
            error,
            tag,
          });
        }
      }
      upsertedGame.tags = upsertedTags;
    }

    if (game.genres?.length) {
      const upsertedGenres: GenreMetadata[] = [];
      for (const genre of game.genres) {
        try {
          if (
            !upsertedGenres.find(
              (upsertedGenre) =>
                upsertedGenre.provider_slug === genre.provider_slug &&
                upsertedGenre.provider_data_id === genre.provider_data_id,
            )
          ) {
            upsertedGenres.push(await this.genreMetadataService.save(genre));
          }
        } catch (error) {
          logger.error({
            message: `Error upserting genre metadata`,
            error,
            genre,
          });
        }
      }
      upsertedGame.genres = upsertedGenres;
    }

    logger.debug({
      message: `Saving game metadata`,
      game: upsertedGame,
      already_exists: !!existingMetadata,
    });

    return this.gameMetadataRepository.save(upsertedGame);
  }
}
