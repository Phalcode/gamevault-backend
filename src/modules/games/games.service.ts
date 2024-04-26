import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { FindOptions } from "../../globals";
import { BoxArtsService } from "../boxarts/boxarts.service";
import { ImagesService } from "../images/images.service";
import { RawgService } from "../providers/rawg/rawg.service";
import { Game } from "./game.entity";
import { GameExistence } from "./models/game-existence.enum";
import { UpdateGameDto } from "./models/update-game.dto";

@Injectable()
export class GamesService {
  private readonly logger = new Logger(GamesService.name);

  constructor(
    @InjectRepository(Game)
    private gamesRepository: Repository<Game>,
    @Inject(forwardRef(() => RawgService))
    private rawgService: RawgService,
    @Inject(forwardRef(() => BoxArtsService))
    private boxartService: BoxArtsService,
    private imagesService: ImagesService,
  ) {}

  public async findByGameIdOrFail(
    id: number,
    options: FindOptions = { loadDeletedEntities: true, loadRelations: false },
  ): Promise<Game> {
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

      const games = await this.gamesRepository.findOneOrFail({
        where: { id },
        relations,
        withDeleted: options.loadDeletedEntities,
        relationLoadStrategy: "query",
      });
      return this.filterDeletedSubEntities(games);
    } catch (error) {
      throw new NotFoundException(
        `Game with id ${id} was not found on the server.`,
        { cause: error },
      );
    }
  }

  /** Checks if a game exists in the database. */
  public async checkIfExistsInDatabase(
    game: Game,
  ): Promise<[GameExistence, Game]> {
    if (!game.file_path || (!game.title && !game.release_date)) {
      throw new InternalServerErrorException(
        game,
        "Dupe-Checking Data not available in indexed game!",
      );
    }
    const existingGameByPath = await this.gamesRepository.findOne({
      where: { file_path: game.file_path },
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

    if (foundGame.file_path != game.file_path) {
      differences.push(
        `file_path: ${foundGame.file_path} -> ${game.file_path}`,
      );
    }
    if (foundGame.title != game.title) {
      differences.push(`title: ${foundGame.title} -> ${game.title}`);
    }
    if (
      +foundGame.release_date != +game.release_date &&
      foundGame.rawg_release_date &&
      +foundGame.release_date != +foundGame.rawg_release_date
    ) {
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

  /** Retrieves all games from the database. */
  public async getAll(): Promise<Game[]> {
    return this.gamesRepository.find();
  }

  public async getRandom(): Promise<Game> {
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

  /**
   * Remaps the Rawg ID of a game and nulls out all related fields except
   * progresses. Then recaches the game.
   */
  public async remap(game: Game, new_rawg_id: number): Promise<Game> {
    game.rawg_id = new_rawg_id;

    // Null all fields except progresses so that none of the old data is used
    game.rawg_title = null;
    game.rawg_release_date = null;
    game.cache_date = null;
    game.description = null;
    game.box_image = null;
    game.background_image = null;
    game.website_url = null;
    game.metacritic_rating = null;
    game.average_playtime = null;
    game.publishers = [];
    game.developers = [];
    game.stores = [];
    game.tags = [];
    game.genres = [];

    game = await this.save(game);

    game = (await this.rawgService.checkCache([game]))[0];

    // Refetch the boxart and return
    return await this.boxartService.check(game);
  }

  /** Save a game to the database. */
  public async save(game: Game): Promise<Game> {
    return this.gamesRepository.save(game);
  }

  /** Soft delete a game from the database. */
  public delete(game: Game) {
    return this.gamesRepository.softRemove(game);
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
    let game = await this.findByGameIdOrFail(id, {
      loadDeletedEntities: true,
      loadRelations: true,
    });

    // Remaps the Game
    if (dto.rawg_id != null) {
      game = await this.remap(game, dto.rawg_id);
    }

    // Updates BoxArt
    if (dto.box_image_id != null)
      game.box_image = await this.imagesService.findByImageIdOrFail(
        dto.box_image_id,
      );

    // Updates Background Image
    if (dto.background_image_id != null)
      game.background_image = await this.imagesService.findByImageIdOrFail(
        dto.background_image_id,
      );

    return this.gamesRepository.save(game);
  }

  /** Restore a game that has been soft deleted. */
  public async restore(id: number): Promise<Game> {
    await this.gamesRepository.recover({ id });
    return this.findByGameIdOrFail(id);
  }

  private filterDeletedSubEntities(game?: Game): Game {
    return {
      ...game,
      genres: game?.genres?.filter((entity) => !entity.deleted_at),
      tags: game?.tags?.filter((entity) => !entity.deleted_at),
      developers: game?.developers?.filter((entity) => !entity.deleted_at),
      publishers: game?.publishers?.filter((entity) => !entity.deleted_at),
      stores: game?.stores?.filter((entity) => !entity.deleted_at),
      progresses: game?.progresses?.filter((entity) => !entity.deleted_at),
    };
  }
}
