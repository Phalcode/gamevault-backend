import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { validate } from "class-validator";
import {
  FindManyOptions,
  FindOneOptions,
  LessThanOrEqual,
  Repository,
} from "typeorm";

import { FindOptions } from "../../globals";
import { GameMetadata } from "../metadata/games/game.metadata.entity";
import { GameMetadataService } from "../metadata/games/game.metadata.service";
import { MetadataService } from "../metadata/metadata.service";
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
    validate(game);
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
      game.user_metadata = await this.gameMetadataService.save({
        ...dto.user_metadata,
        id: game.user_metadata?.id,
        provider_slug: game.user_metadata?.provider_slug || "user",
        provider_data_id: game.user_metadata?.provider_data_id || game.id,
        created_at: game.user_metadata?.created_at || undefined,
        updated_at: game.user_metadata?.updated_at || undefined,
        entity_version: game.user_metadata?.entity_version || undefined,
        gamevault_games: game.metadata.gamevault_games || undefined,
      } as GameMetadata);
      const updatedGame = await this.save(game);
      this.logger.log({
        message: "Game User Metadata updated",
        game: game.getLoggableData(),
        details: updatedGame,
      });
    }

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
    if (!game.path || (!game.title && !game.release_date)) {
      throw new InternalServerErrorException(
        game,
        "Dupe-Checking Data not available in indexed game!",
      );
    }
    const existingGameByPath = await this.gamesRepository.findOne({
      where: { path: game.path },
      withDeleted: true,
    });

    const existingGameByTitleAndReleaseDate =
      await this.gamesRepository.findOne({
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

    if (foundGame.path != game.path) {
      differences.push(`path: ${foundGame.path} -> ${game.path}`);
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
          path: game.path,
        },
        existingGame: {
          id: foundGame.id,
          path: foundGame.path,
        },
        differences,
      });
      return [GameExistence.EXISTS_BUT_ALTERED, foundGame];
    }

    return [GameExistence.EXISTS, foundGame];
  }
}
