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
import { Game } from "../database/entities/game.entity";
import { RawgService } from "./rawg.service";
import { GameExistance } from "../models/game-existance.enum";
import { BoxArtService } from "./box-art.service";

@Injectable()
export class GamesService {
  private readonly logger = new Logger(GamesService.name);

  constructor(
    @InjectRepository(Game)
    private gamesRepository: Repository<Game>,
    @Inject(forwardRef(() => RawgService))
    private rawgService: RawgService,
    private boxartService: BoxArtService,
  ) {}

  /**
   * Retrieves a Game from the database by its id.
   *
   * @param id - The id of the Game to retrieve.
   * @param [loadRelations=false] - A flag indicating whether to load the Game's
   *   related entities. Default is `false`
   * @returns - A Promise that resolves to the retrieved Game.
   * @throws {NotFoundException} - If a Game with the specified id is not found
   *   in the database.
   */
  public async getGameById(id: number, loadRelations = false): Promise<Game> {
    try {
      return await this.gamesRepository.findOneOrFail({
        where: { id: id },
        relations: loadRelations
          ? [
              "developers",
              "publishers",
              "genres",
              "stores",
              "tags",
              "progresses",
              "progresses.user",
              "box_image",
              "background_image",
            ]
          : [],
        withDeleted: true,
      });
    } catch (error) {
      throw new NotFoundException(
        `Game with id ${id} was not found on the server.`,
      );
    }
  }

  /**
   * Checks if a game exists in the database.
   *
   * @param {Game} game - The game object to check.
   * @returns {Promise<[GameExistance, Game]>} A promise that resolves to a
   *   tuple containing the game existence status and the found game.
   * @throws {InternalServerErrorException} If the game does not have necessary
   *   data for dupe-checking.
   */
  public async checkIfGameExistsInDatabase(
    game: Game,
  ): Promise<[GameExistance, Game]> {
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
      return [GameExistance.DOES_NOT_EXIST, undefined];
    }

    if (foundGame.deleted_at) {
      return [GameExistance.EXISTS_BUT_DELETED, foundGame];
    }

    const differences: string[] = [];

    if (foundGame.file_path !== game.file_path) {
      differences.push(
        `File Path: ${foundGame.file_path} -> ${game.file_path}`,
      );
    }
    if (foundGame.title !== game.title) {
      differences.push(`Title: ${foundGame.title} -> ${game.title}`);
    }
    if (+foundGame.release_date !== +game.release_date) {
      differences.push(
        `Release Date: ${foundGame.release_date} -> ${game.release_date}`,
      );
    }
    if (foundGame.early_access !== game.early_access) {
      differences.push(
        `Early Access: ${foundGame.early_access} -> ${game.early_access}`,
      );
    }
    if (foundGame.type !== game.type) {
      differences.push(`Game Type: ${foundGame.type} -> ${game.type}`);
    }
    if (foundGame.version != game.version) {
      differences.push(`Version: ${foundGame.version} -> ${game.version}`);
    }
    if (foundGame.size.toString() !== game.size.toString()) {
      differences.push(`Size: ${foundGame.size} -> ${game.size}`);
    }

    if (differences.length > 0) {
      this.logger.debug(
        `Game exists but has been altered. Differences:\n ${differences.join(
          ",\n ",
        )}`,
      );
      return [GameExistance.EXISTS_BUT_ALTERED, foundGame];
    }

    return [GameExistance.EXISTS, foundGame];
  }

  /**
   * Retrieves all games from the database.
   *
   * @returns A promise that resolves to an array of all games in the database.
   * @throws {Error} If there is an error retrieving the games from the
   *   database.
   */
  public async getAllGames(): Promise<Game[]> {
    return this.gamesRepository.find();
  }

  public async getRandomGame(): Promise<Game> {
    const game = await this.gamesRepository
      .createQueryBuilder("game")
      .select("game.id")
      .orderBy("RANDOM()")
      .limit(1)
      .getOne();

    return this.getGameById(game.id, true);
  }

  /**
   * Remaps the Rawg ID of a game and nulls out all related fields except
   * progresses. Then recaches the game.
   *
   * @param id - The ID of the game to remap.
   * @param new_rawg_id - The new Rawg ID to set for the game.
   * @returns - The remapped game object.
   * @throws {NotFoundException} - If the game with the provided ID is not found
   *   in the database.
   */
  public async remapGame(id: number, new_rawg_id: number): Promise<Game> {
    // Fetch the game to remap from the database and set the new rawg_id
    let game = await this.getGameById(id);
    game.rawg_id = new_rawg_id;

    // Null all related fields but keep progresses
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

    game = await this.saveGame(game);
    // Recache the game
    await this.rawgService.cacheGames([game]);
    // Refetch the boxart
    await this.boxartService.checkBoxArt(game);
    // Return the new game object
    return game;
  }

  /**
   * Save a game to the database.
   *
   * @param game - The game object to save.
   * @returns - The saved game object.
   */
  public async saveGame(game: Game): Promise<Game> {
    return this.gamesRepository.save(game);
  }

  /**
   * Soft delete a game from the database.
   *
   * @param id - The id of the game to delete.
   */
  public deleteGame(game: Game) {
    return this.gamesRepository.softRemove(game);
  }

  /**
   * Restore a game that has been soft deleted.
   *
   * @param id - The id of the game to restore.
   * @returns - The restored game object.
   */
  public async restoreGame(id: number): Promise<Game> {
    await this.gamesRepository.recover({ id: id });
    return this.getGameById(id);
  }
}
