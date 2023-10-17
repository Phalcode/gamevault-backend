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
import { Game } from "./game.entity";
import { RawgService } from "../providers/rawg/rawg.service";
import { GameExistence } from "./models/game-existence.enum";
import { BoxArtsService } from "../boxarts/boxarts.service";
import { UpdateGameDto } from "./models/update-game.dto";
import { ImagesService } from "../images/images.service";
import { FindOptions } from "../../globals";

@Injectable()
export class GamesService {
  private readonly logger = new Logger(GamesService.name);

  constructor(
    @InjectRepository(Game)
    private gamesRepository: Repository<Game>,
    @Inject(forwardRef(() => RawgService))
    private rawgService: RawgService,
    private boxartService: BoxArtsService,
    private imagesService: ImagesService,
  ) {}

  public async findByIdOrFail(
    id: number,
    options: FindOptions = { loadDeletedEntities: true, loadRelations: false },
  ): Promise<Game> {
    try {
      return await this.gamesRepository.findOneOrFail({
        where: { id },
        relations: options.loadRelations
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
        withDeleted: options.loadDeletedEntities,
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
   * @returns {Promise<[GameExistence, Game]>} A promise that resolves to a
   *   tuple containing the game existence status and the found game.
   * @throws {InternalServerErrorException} If the game does not have necessary
   *   data for dupe-checking.
   */
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
      return [GameExistence.EXISTS_BUT_DELETED, foundGame];
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
    if (foundGame.version != game.version) {
      differences.push(`Version: ${foundGame.version} -> ${game.version}`);
    }
    if (foundGame.size.toString() !== game.size.toString()) {
      differences.push(`Size: ${foundGame.size} -> ${game.size}`);
    }

    if (differences.length > 0) {
      this.logger.debug(
        `Game "${
          game.file_path
        }" exists but has been altered. Differences:\n ${differences.join(
          ",\n ",
        )}`,
      );
      return [GameExistence.EXISTS_BUT_ALTERED, foundGame];
    }

    return [GameExistence.EXISTS, foundGame];
  }

  /**
   * Retrieves all games from the database.
   *
   * @returns A promise that resolves to an array of all games in the database.
   * @throws {Error} If there is an error retrieving the games from the
   *   database.
   */
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

    return this.findByIdOrFail(game.id, {
      loadDeletedEntities: true,
      loadRelations: true,
    });
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
  public async remap(id: number, new_rawg_id: number): Promise<Game> {
    // Fetch the game to remap from the database and set the new rawg_id
    let game = await this.findByIdOrFail(id);
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

    game = await this.save(game);
    // Recache the game
    await this.rawgService.checkCache([game]);
    // Refetch the boxart
    await this.boxartService.check(game);
    // Return the new game object
    return game;
  }

  /**
   * Save a game to the database.
   *
   * @param game - The game object to save.
   * @returns - The saved game object.
   */
  public async save(game: Game): Promise<Game> {
    return this.gamesRepository.save(game);
  }

  /**
   * Soft delete a game from the database.
   *
   * @param id - The id of the game to delete.
   */
  public delete(game: Game) {
    return this.gamesRepository.softRemove(game);
  }

  public async update(id: number, dto: UpdateGameDto, username: string) {
    const game =
      dto.rawg_id != null
        ? await this.remap(id, dto.rawg_id)
        : await this.findByIdOrFail(id);

    // Updates BoxArt if Necessary
    if (dto.box_image_url != null) {
      game.box_image = await this.imagesService.downloadByUrl(
        dto.box_image_url,
        username,
      );
    }

    if (dto.box_image_id != null)
      game.box_image = await this.imagesService.findByIdOrFail(
        dto.box_image_id,
      );

    // Updates Background Image if Necessary
    if (dto.background_image_url != null) {
      game.background_image = await this.imagesService.downloadByUrl(
        dto.background_image_url,
        username,
      );
    }

    if (dto.background_image_id != null)
      game.background_image = await this.imagesService.findByIdOrFail(
        dto.background_image_id,
      );

    return this.gamesRepository.save(game);
  }

  /**
   * Restore a game that has been soft deleted.
   *
   * @param id - The id of the game to restore.
   * @returns - The restored game object.
   */
  public async restore(id: number): Promise<Game> {
    await this.gamesRepository.recover({ id });
    return this.findByIdOrFail(id);
  }
}
