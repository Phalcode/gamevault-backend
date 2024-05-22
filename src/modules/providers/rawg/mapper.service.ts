import { Injectable, Logger } from "@nestjs/common";

import { DevelopersService } from "../../developers/developers.service";
import { Game } from "../../games/game.entity";
import { GenresService } from "../../genres/genres.service";
import { ImagesService } from "../../images/images.service";
import { PublishersService } from "../../publishers/publishers.service";
import { StoresService } from "../../stores/stores.service";
import { TagsService } from "../../tags/tags.service";
import { RawgGame } from "./models/game.interface";

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
  public async mapRawgGameToGame(game: RawgGame, entity: Game): Promise<Game> {
    this.logger.debug({
      message: `Mapping RAWG Game...`,
      gameTitle: entity.title,
      rawgGameTitle: game.name,
    });
    entity = await this.mapRawgStoresToGame(game, entity);
    entity = await this.mapRawgDevelopersToGame(game, entity);
    entity = await this.mapRawgPublishersToGame(game, entity);
    entity = await this.mapRawgTagsToGame(game, entity);
    entity = await this.mapRawgGenresToGame(game, entity);
    entity = await this.mapRawgGameDetailsToGame(game, entity);
    entity.cache_date = new Date();
    return entity;
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
    rawgGame: RawgGame,
    game: Game,
  ): Promise<Game> {
    try {
      if (
        rawgGame.background_image &&
        (!game.background_image?.id ||
          !(await this.imagesService.isAvailable(game.background_image.id)))
      ) {
        try {
          game.background_image = await this.imagesService.downloadByUrl(
            rawgGame.background_image,
          );
        } catch (error) {
          this.logger.error({
            message: "Error downloading background image.",
            game: { id: game.id, file_path: game.file_path },
            error,
          });
        }
      }

      if (
        rawgGame.box_image &&
        (!game.box_image?.id ||
          !(await this.imagesService.isAvailable(game.box_image.id)))
      ) {
        try {
          game.box_image = await this.imagesService.downloadByUrl(
            rawgGame.box_image,
          );
        } catch (error) {
          this.logger.error({
            message: "Error downloading box image.",
            game: { id: game.id, file_path: game.file_path },
            error,
          });
        }
      }

      game.rawg_title = rawgGame.name ?? game.rawg_title;
      game.rawg_id = rawgGame.id ?? game.rawg_id;
      game.description = rawgGame.description_raw ?? game.description;
      game.website_url = rawgGame.website ?? game.website_url;
      game.metacritic_rating = rawgGame.metacritic ?? game.metacritic_rating;

      game.rawg_release_date =
        this.getReleaseDate(rawgGame) ?? game.rawg_release_date;

      if (!game.release_date && game.rawg_release_date) {
        game.release_date = game.rawg_release_date;
      }

      if (rawgGame.playtime) {
        game.average_playtime = rawgGame.playtime * 60;
      }

      return game;
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
