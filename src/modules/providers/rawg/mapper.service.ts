import { Injectable, Logger } from "@nestjs/common";
import { Game } from "../../games/game.entity";
import { RawgGame } from "./models/game.interface";
import { DevelopersService } from "../../developers/developers.service";
import { GenresService } from "../../genres/genres.service";
import { ImagesService } from "../../images/images.service";
import { PublishersService } from "../../publishers/publishers.service";
import { StoresService } from "../../stores/stores.service";
import { TagsService } from "../../tags/tags.service";

@Injectable()
export class RawgMapperService {
  private readonly logger = new Logger(RawgMapperService.name);

  constructor(
    private tagService: TagsService,
    private genreService: GenresService,
    private publishersService: PublishersService,
    private developersService: DevelopersService,
    private storesService: StoresService,
    private imagesService: ImagesService,
  ) {}

  /**
   * Maps a RawgGame to a Game entity, filling missing information in the entity
   * using the RawgGame.
   */
  public async mapRawgGameToGame(
    rawg_game: RawgGame,
    game: Game,
  ): Promise<Game> {
    this.logger.debug({
      message: `Mapping RAWG Game...`,
      gameTitle: game.title,
      rawgGameTitle: rawg_game.name,
    });
    game = await this.mapRawgStoresToGame(rawg_game, game);
    game = await this.mapRawgDevelopersToGame(rawg_game, game);
    game = await this.mapRawgPublishersToGame(rawg_game, game);
    game = await this.mapRawgTagsToGame(rawg_game, game);
    game = await this.mapRawgGenresToGame(rawg_game, game);
    game = await this.mapRawgGameDetailsToGame(rawg_game, game);
    game.cache_date = new Date();
    return game;
  }

  /** Maps stores from RawgGame to Game entity. */
  private async mapRawgStoresToGame(
    game: RawgGame,
    entity: Game,
  ): Promise<Game> {
    try {
      entity.stores = [];
      if (!game.stores) return entity;
      for (const storeContainer of game.stores) {
        const store = storeContainer.store;
        entity.stores.push(
          await this.storesService.getOrCreate(store.name, store.id),
        );
      }
    } catch (error) {
      this.logger.error({
        message: "Error mapping stores to game entity.",
        error,
      });
    }
    return entity;
  }

  /** Maps developers from RawgGame to Game entity. */
  private async mapRawgDevelopersToGame(
    game: RawgGame,
    entity: Game,
  ): Promise<Game> {
    try {
      entity.developers = [];
      if (!game.developers) return entity;
      for (const developer of game.developers) {
        entity.developers.push(
          await this.developersService.getOrCreate(
            developer.name,
            developer.id,
          ),
        );
      }
    } catch (error) {
      this.logger.error({
        message: "Error mapping developers to game entity.",
        error,
      });
    }
    return entity;
  }

  /** Maps publishers from RawgGame to Game entity. */
  private async mapRawgPublishersToGame(
    game: RawgGame,
    entity: Game,
  ): Promise<Game> {
    try {
      entity.publishers = [];
      if (!game.publishers) return entity;
      for (const publisher of game.publishers) {
        entity.publishers.push(
          await this.publishersService.getOrCreate(
            publisher.name,
            publisher.id,
          ),
        );
      }
    } catch (error) {
      this.logger.error({
        message: "Error mapping publishers to game entity.",
        error,
      });
    }
    return entity;
  }

  /** Maps tags from RawgGame to Game entity. Only English tags are mapped. */
  private async mapRawgTagsToGame(game: RawgGame, entity: Game): Promise<Game> {
    try {
      entity.tags = [];

      if (!game.tags) {
        return entity;
      }

      for (const tag of game.tags) {
        const isEnglish = tag.language === "eng";
        const isAlphanumeric = /^[a-zA-Z0-9\s&.,-]+$/.test(tag.name);

        if (!isEnglish) {
          this.logger.debug({
            message: "Skipping tag.",
            reason: `Tag has invalid language. Only english tags are supported.`,
            tag,
          });
        } else if (!isAlphanumeric) {
          this.logger.debug({
            message: "Skipping tag.",
            reason: `Tag contains invalid characters.`,
            tag,
          });
        } else {
          entity.tags.push(await this.tagService.getOrCreate(tag.name, tag.id));
        }
      }
    } catch (error) {
      this.logger.error({
        message: "Error mapping tags to game entity.",
        error,
      });
    }

    return entity;
  }

  /** Maps genres from RawgGame to Game entity. */
  private async mapRawgGenresToGame(
    game: RawgGame,
    entity: Game,
  ): Promise<Game> {
    try {
      entity.genres = [];
      if (!game.genres) return entity;
      for (const genre of game.genres) {
        entity.genres.push(
          await this.genreService.getOrCreate(genre.name, genre.id),
        );
      }
    } catch (error) {
      this.logger.error({
        message: "Error mapping genres to game entity.",
        error,
      });
    }
    return entity;
  }

  /** Maps a RawgGame object to a Game entity. */
  private async mapRawgGameDetailsToGame(
    game: RawgGame,
    entity: Game,
  ): Promise<Game> {
    try {
      if (
        game.background_image &&
        (!entity.background_image?.id ||
          !(await this.imagesService.isAvailable(entity.background_image.id)))
      ) {
        entity.background_image = await this.imagesService.downloadByUrl(
          game.background_image,
        );
      }
      entity.rawg_title = game.name ?? entity.rawg_title;
      entity.rawg_id = game.id ?? entity.rawg_id;
      entity.description = game.description_raw ?? entity.description;
      entity.website_url = game.website ?? entity.website_url;
      entity.metacritic_rating = game.metacritic ?? entity.metacritic_rating;

      entity.rawg_release_date =
        this.getReleaseDate(game) ?? entity.rawg_release_date;

      if (!entity.release_date && entity.rawg_release_date) {
        entity.release_date = entity.rawg_release_date;
      }

      if (game.playtime) {
        entity.average_playtime = game.playtime * 60;
      }

      return entity;
    } catch (error) {
      this.logger.error({
        message: "Error mapping rawg game to game entity.",
        error,
      });
      throw error;
    }
  }

  /**
   * Returns the release date for a RawgGame object or null if it is not
   * available.
   */
  private getReleaseDate(game: RawgGame): Date | null {
    const pcReleaseDate = game.platforms?.find(
      (p) => p.platform.id === 4,
    )?.released_at;
    const generalReleaseDate = game.released;

    if (pcReleaseDate) {
      return new Date(pcReleaseDate);
    } else if (generalReleaseDate) {
      return new Date(generalReleaseDate);
    } else {
      return null;
    }
  }
}
