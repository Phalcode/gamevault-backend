import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { DeletedEntitiesFilter } from "../../filters/deleted-entities.filter";
import { FindOptions } from "../../globals";
import { MediaService } from "../media/media.service";
import { GamevaultGame } from "./game.entity";
import { GameExistence } from "./models/game-existence.enum";
import { UpdateGameDto } from "./models/update-game.dto";

@Injectable()
export class GamesService {
  private readonly logger = new Logger(GamesService.name);

  constructor(
    @InjectRepository(GamevaultGame)
    private gamesRepository: Repository<GamevaultGame>,
    private mediaService: MediaService,
  ) {}

  public async findByGameIdOrFail(
    id: number,
    options: FindOptions = { loadDeletedEntities: true, loadRelations: false },
  ): Promise<GamevaultGame> {
    try {
      let relations = [];

      if (options.loadRelations) {
        if (options.loadRelations === true) {
          relations = [
            "developers",
            "publishers",
            "genres",
            "stores",
            "tags",
            "progresses",
            "progresses.user",
            "box_image",
            "background_image",
            "bookmarked_users",
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
  public async getAll(): Promise<GamevaultGame[]> {
    return this.gamesRepository.find();
  }

  public async getRandom(): Promise<GamevaultGame> {
    const game = await this.gamesRepository
      .createQueryBuilder("game")
      .select("game.id")
      .orderBy("RANDOM()")
      .limit(1)
      .getOne();

    return this.findByGameIdOrFail(game.id, {
      loadDeletedEntities: true,
      loadRelations: true,
    });
  }

  /** Unmaps Metadata of a game then saves it. */
  public async unmap(id: number): Promise<GamevaultGame> {
    const game = await this.findByGameIdOrFail(id);
    //TODO: Unmap Metadata
    this.logger.log({ message: "Unmapped Game", game });
    return await this.gamesRepository.save(game);
  }

  /**
   * Remaps the Rawg ID of a game then recaches the game.
   */
  public async remap(id: number): Promise<GamevaultGame> {
    const game = await this.unmap(id);
    //TODO: Remap Metadata
    return await this.gamesRepository.save(game);
  }

  /** Save a game to the database. */
  public async save(game: GamevaultGame): Promise<GamevaultGame> {
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
    const game = await this.findByGameIdOrFail(id, {
      loadDeletedEntities: true,
      loadRelations: true,
    });

    // Remaps the Game
    if (dto.rawg_id != null) {
      //TODO: Remap a game
      //game = await this.remap(game.id, dto.rawg_id);
    }

    return this.gamesRepository.save(game);
  }

  /** Restore a game that has been soft deleted. */
  public async restore(id: number): Promise<GamevaultGame> {
    await this.gamesRepository.recover({ id });
    return this.findByGameIdOrFail(id);
  }
}
