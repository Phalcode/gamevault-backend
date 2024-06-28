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
import { Repository } from "typeorm";

import { DeletedEntitiesFilter } from "../../filters/deleted-entities.filter";
import { FindOptions } from "../../globals";
import { MediaService } from "../media/media.service";
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
    @Inject(forwardRef(() => MediaService))
    private mediaService: MediaService,
    @Inject(forwardRef(() => MetadataService))
    private metadataService: MetadataService,
  ) {}

  public async findOneByGameIdOrFail(
    id: number,
    options: FindOptions = { loadDeletedEntities: true, loadRelations: false },
  ): Promise<GamevaultGame> {
    try {
      let relations = [];

      if (options.loadRelations) {
        if (options.loadRelations === true) {
          relations = [
            "progresses",
            "progresses.user",
            "bookmarked_users",
            "metadata",
            "user_metadata",
            "provider_metadata",
          ];
        } else if (Array.isArray(options.loadRelations))
          relations = options.loadRelations;
      }

      const game = await this.gamesRepository.findOneOrFail({
        where: { id },
        relations,
        withDeleted: options.loadDeletedEntities,
        relationLoadStrategy: "query",
      });
      return DeletedEntitiesFilter.filterDeleted(game) as GamevaultGame;
    } catch (error) {
      throw new NotFoundException(
        `Game with id ${id} was not found on the server.`,
        { cause: error },
      );
    }
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

  /** Retrieves all games from the database. */
  public async find(): Promise<GamevaultGame[]> {
    return this.gamesRepository.find();
  }

  public async findRandom(): Promise<GamevaultGame> {
    const game = await this.gamesRepository
      .createQueryBuilder("game")
      .select("game.id")
      .orderBy("RANDOM()")
      .limit(1)
      .getOne();

    return this.findOneByGameIdOrFail(game.id, {
      loadDeletedEntities: true,
      loadRelations: true,
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

  /**
   * Updates a game with the provided ID using the information in the DTO. If
   * the DTO contains a rawg_id, the game will be remapped. Otherwise, the game
   * will be found by the provided ID. If the DTO contains a box_image_id, the
   * game's box_image will be updated. If the DTO contains a
   * background_image_id, the game's background_image will be updated. Finally,
   * the updated game will be saved and returned.
   *
   * @param id - The ID of the game to update.
   * @param dto - The DTO containing the updated game information.
   * @returns The updated game.
   */
  public async update(id: number, dto: UpdateGameDto) {
    // Finds the game by ID
    const game = await this.findOneByGameIdOrFail(id, {
      loadDeletedEntities: true,
      loadRelations: true,
    });

    for (const request of dto.mapping_requests) {
      if (request.target_provider_data_id) {
        await this.metadataService.remap(
          id,
          request.provider_slug,
          request.target_provider_data_id,
        );
      } else {
        await this.metadataService.unmap(id, request.provider_slug);
      }
    }

    return this.save(game);
  }

  /** Restore a game that has been soft deleted. */
  public async restore(id: number): Promise<GamevaultGame> {
    await this.gamesRepository.recover({ id });
    return this.findOneByGameIdOrFail(id);
  }
}
