import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  FindManyOptions,
  FindOneOptions,
  LessThanOrEqual,
  Repository,
} from "typeorm";

import { FindOptions } from "../../globals";
import { DeveloperMetadata } from "../metadata/developers/developer.metadata.entity";
import { GameMetadata } from "../metadata/games/game.metadata.entity";
import { GameMetadataService } from "../metadata/games/game.metadata.service";
import { GenreMetadata } from "../metadata/genres/genre.metadata.entity";
import { MetadataService } from "../metadata/metadata.service";
import { PublisherMetadata } from "../metadata/publishers/publisher.metadata.entity";
import { TagMetadata } from "../metadata/tags/tag.metadata.entity";
import { GamevaultGame } from "./gamevault-game.entity";
import { GameExistence } from "./models/game-existence.enum";
import { UpdateGameDto } from "./models/update-game.dto";

@Injectable()
export class GamesService {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectRepository(GamevaultGame)
    private gamesRepository: Repository<GamevaultGame>,
    @Inject(forwardRef(() => MetadataService))
    private metadataService: MetadataService,
    @Inject(forwardRef(() => GameMetadataService))
    private gameMetadataService: GameMetadataService,
  ) {}

  public async findOneByGameIdOrFail(
    id: number,
    options: FindOptions,
  ): Promise<GamevaultGame> {
    try {
      const findParameters: FindOneOptions<GamevaultGame> = {
        where: { id },
        relationLoadStrategy: "query",
      };

      if (options.loadRelations) {
        if (options.loadRelations === true) {
          findParameters.relations = [
            "progresses",
            "progresses.user",
            "bookmarked_users",
            "metadata",
            "provider_metadata",
            "user_metadata",
          ];
        } else if (Array.isArray(options.loadRelations))
          findParameters.relations = options.loadRelations;
      }

      if (options.loadDeletedEntities) {
        findParameters.withDeleted = true;
      }

      if (options.filterByAge) {
        if (!options.loadRelations) {
          findParameters.relations = ["metadata"];
        }
        findParameters.where = {
          id,
          metadata: { age_rating: LessThanOrEqual(options.filterByAge) },
        };
      }

      return await this.gamesRepository.findOneOrFail(findParameters);
    } catch (error) {
      throw new NotFoundException(
        `Game with id ${id} was not found on the server.`,
        { cause: error },
      );
    }
  }

  /** Retrieves all games from the database. */
  public async find(options: FindOptions): Promise<GamevaultGame[]> {
    const findParameters: FindManyOptions<GamevaultGame> = {
      relationLoadStrategy: "query",
    };

    if (options.loadRelations) {
      if (options.loadRelations === true) {
        findParameters.relations = [
          "progresses",
          "progresses.user",
          "bookmarked_users",
          "metadata",
          "provider_metadata",
          "user_metadata",
        ];
      } else if (Array.isArray(options.loadRelations))
        findParameters.relations = options.loadRelations;
    }

    if (options.loadDeletedEntities) {
      findParameters.withDeleted = true;
    }

    if (options.filterByAge) {
      if (!options.loadRelations) {
        findParameters.relations = ["metadata"];
      }
      findParameters.where = {
        metadata: { age_rating: LessThanOrEqual(options.filterByAge) },
      };
    }

    return this.gamesRepository.find(findParameters);
  }

  public async findRandom(options: FindOptions): Promise<GamevaultGame> {
    if (options.loadDeletedEntities) {
      throw new InternalServerErrorException(
        "Cannot load deleted games in random mode.",
      );
    }

    const randomQuery = this.gamesRepository
      .createQueryBuilder("game")
      .select("game.id, game.age_rating")
      .where("game.deleted_at IS NULL");

    if (options.filterByAge) {
      randomQuery.andWhere("game.age_rating <= :ageRating", {
        ageRating: options.filterByAge,
      });
    }

    randomQuery.orderBy("RANDOM()").limit(1);

    const game = await randomQuery.getOne();

    if (!game) {
      throw new NotFoundException("Could not find a suitable random game.");
    }

    return this.findOneByGameIdOrFail(game.id, {
      loadDeletedEntities: false,
      loadRelations: options.loadRelations,
      filterByAge: options.filterByAge,
    });
  }
  /** Save a game to the database. */
  public async save(game: GamevaultGame): Promise<GamevaultGame> {
    return this.gamesRepository.save(game);
  }

  /** Soft delete a game from the database. */
  public delete(id: number): Promise<GamevaultGame> {
    return this.gamesRepository.softRemove({ id });
  }

  public async update(id: number, dto: UpdateGameDto) {
    // Finds the game by ID
    const game = await this.findOneByGameIdOrFail(id, {
      loadDeletedEntities: true,
      loadRelations: true,
    });

    if (dto.user_metadata) {
      const updatedUserMetadata = game.user_metadata || new GameMetadata();

      updatedUserMetadata.id = game.user_metadata.id || undefined;
      updatedUserMetadata.provider_slug = "user";
      updatedUserMetadata.provider_data_id = game.id.toString();
      updatedUserMetadata.created_at =
        game.user_metadata.created_at || undefined;
      updatedUserMetadata.updated_at =
        game.user_metadata.updated_at || undefined;
      updatedUserMetadata.entity_version =
        game.user_metadata.entity_version || undefined;
      updatedUserMetadata.gamevault_games =
        game.metadata.gamevault_games || undefined;

      if (dto.user_metadata.age_rating) {
        updatedUserMetadata.age_rating = dto.user_metadata.age_rating;
      }

      if (dto.user_metadata.title) {
        updatedUserMetadata.title = dto.user_metadata.title;
      }

      if (game.user_metadata.release_date) {
        updatedUserMetadata.release_date = new Date(
          dto.user_metadata.release_date,
        );
      }

      if (dto.user_metadata.description) {
        updatedUserMetadata.description = dto.user_metadata.description;
      }

      if (dto.user_metadata.notes) {
        updatedUserMetadata.notes = dto.user_metadata.notes;
      }

      if (dto.user_metadata.average_playtime) {
        updatedUserMetadata.average_playtime =
          dto.user_metadata.average_playtime;
      }

      if (dto.user_metadata.cover) {
        updatedUserMetadata.cover = dto.user_metadata.cover;
      }

      if (dto.user_metadata.background) {
        updatedUserMetadata.background = dto.user_metadata.background;
      }

      if (dto.user_metadata.screenshots) {
        updatedUserMetadata.screenshots = dto.user_metadata.screenshots;
      }

      if (dto.user_metadata.url_website) {
        updatedUserMetadata.url_website = dto.user_metadata.url_website;
      }

      if (dto.user_metadata.rating) {
        updatedUserMetadata.rating = dto.user_metadata.rating;
      }

      if (dto.user_metadata.early_access) {
        updatedUserMetadata.early_access = dto.user_metadata.early_access;
      }

      if (dto.user_metadata.launch_parameters) {
        updatedUserMetadata.launch_parameters =
          dto.user_metadata.launch_parameters;
      }

      if (dto.user_metadata.launch_executable) {
        updatedUserMetadata.launch_executable =
          dto.user_metadata.launch_executable;
      }

      if (dto.user_metadata.installer_executable) {
        updatedUserMetadata.installer_executable =
          dto.user_metadata.installer_executable;
      }

      if (dto.user_metadata.tags) {
        updatedUserMetadata.tags = dto.user_metadata.tags.map((tag) => {
          return {
            provider_slug: "user",
            provider_data_id: tag.toLowerCase(),
            name: tag,
          } as TagMetadata;
        });
      }

      if (dto.user_metadata.genres) {
        updatedUserMetadata.genres = dto.user_metadata.genres.map((genre) => {
          return {
            provider_slug: "user",
            provider_data_id: genre.toLowerCase(),
            name: genre,
          } as GenreMetadata;
        });
      }

      if (dto.user_metadata.developers) {
        updatedUserMetadata.developers = dto.user_metadata.developers.map(
          (developer) => {
            return {
              provider_slug: "user",
              provider_data_id: developer.toLowerCase(),
              name: developer,
            } as DeveloperMetadata;
          },
        );
      }

      if (dto.user_metadata.publishers) {
        updatedUserMetadata.publishers = dto.user_metadata.publishers.map(
          (publisher) => {
            return {
              provider_slug: "user",
              provider_data_id: publisher.toLowerCase(),
              name: publisher,
            } as PublisherMetadata;
          },
        );
      }

      game.user_metadata =
        await this.gameMetadataService.save(updatedUserMetadata);
      const updatedGame = await this.save(game);
      this.logger.log({
        message: "Game User Metadata updated",
        game: game.getLoggableData(),
        details: updatedGame,
      });
    }

    if (dto.mapping_requests) {
      for (const request of dto.mapping_requests) {
        this.logger.log({
          message: "Handling Mapping Request",
          game: game.getLoggableData(),
          details: request,
        });
        if (request.target_provider_data_id) {
          await this.metadataService.map(
            id,
            request.provider_slug,
            request.target_provider_data_id,
          );
        } else {
          await this.metadataService.unmap(id, request.provider_slug);
        }
      }
    }

    return this.metadataService.merge(game.id);
  }

  /** Restore a game that has been soft deleted. */
  public async restore(id: number): Promise<GamevaultGame> {
    await this.gamesRepository.recover({ id });
    return this.findOneByGameIdOrFail(id, {
      loadDeletedEntities: false,
      loadRelations: true,
    });
  }

  /** Checks if a game exists in the database. */
  public async checkIfExistsInDatabase(
    game: GamevaultGame,
  ): Promise<[GameExistence, GamevaultGame]> {
    if (!game.file_path || (!game.title && !game.release_date)) {
      throw new InternalServerErrorException(
        game,
        "Dupe-Checking Data not available in indexed game!",
      );
    }
    const existingGameByPath = await this.gamesRepository.findOne({
      relationLoadStrategy: "query",
      where: { file_path: game.file_path },
      withDeleted: true,
    });

    const existingGameByTitleAndReleaseDate =
      await this.gamesRepository.findOne({
        relationLoadStrategy: "query",
        where: {
          title: game.title,
          release_date: game.release_date,
        },
        withDeleted: true,
      });

    const foundGame = existingGameByPath ?? existingGameByTitleAndReleaseDate;

    if (!foundGame) {
      return [GameExistence.DOES_NOT_EXIST, undefined];
    }

    if (foundGame.deleted_at) {
      return [GameExistence.EXISTS_BUT_DELETED_IN_DATABASE, foundGame];
    }

    const differences: string[] = [];

    if (foundGame.file_path != game.file_path) {
      differences.push(`path: ${foundGame.file_path} -> ${game.file_path}`);
    }
    if (foundGame.title != game.title) {
      differences.push(`title: ${foundGame.title} -> ${game.title}`);
    }
    if (+foundGame.release_date != +game.release_date) {
      differences.push(
        `release_date: ${foundGame.release_date} -> ${game.release_date}`,
      );
    }
    if (foundGame.early_access != game.early_access) {
      differences.push(
        `early_access: ${foundGame.early_access} -> ${game.early_access}`,
      );
    }
    if (foundGame.version != game.version) {
      differences.push(`version: ${foundGame.version} -> ${game.version}`);
    }
    if (foundGame.size.toString() != game.size.toString()) {
      differences.push(`size: ${foundGame.size} -> ${game.size}`);
    }

    if (differences.length > 0) {
      this.logger.debug({
        message: "Game already exists in the database but has been altered.",
        game: {
          id: game.id,
          file_path: game.file_path,
        },
        existingGame: {
          id: foundGame.id,
          file_path: foundGame.file_path,
        },
        differences,
      });
      return [GameExistence.EXISTS_BUT_ALTERED, foundGame];
    }

    return [GameExistence.EXISTS, foundGame];
  }
}
