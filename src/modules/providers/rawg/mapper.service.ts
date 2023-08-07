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
   *
   * @param entity - The Game entity to fill with information.
   * @param rawg_game - The RawgGame to extract information from.
   * @returns A Promise that resolves with the updated Game entity.
   */
  public async map(entity: Game, rawg_game: RawgGame): Promise<Game> {
    this.logger.debug(`Mapping game "${rawg_game.name}" to "${entity.title}"`);
    entity = await this.mapStoresToEntity(rawg_game, entity);
    entity = await this.mapDevelopersToEntity(rawg_game, entity);
    entity = await this.mapPublishersToEntity(rawg_game, entity);
    entity = await this.mapTagsToEntity(rawg_game, entity);
    entity = await this.mapGenresToEntity(rawg_game, entity);
    entity = await this.mapRawgGameToEntity(rawg_game, entity);
    entity.cache_date = new Date();
    return entity;
  }

  /**
   * Maps stores from RawgGame to Game entity.
   *
   * @param game - The RawgGame object.
   * @param entity - The Game entity.
   * @returns The updated Game entity.
   */
  private async mapStoresToEntity(game: RawgGame, entity: Game): Promise<Game> {
    try {
      entity.stores = [];
      if (!game.stores) return entity;
      for (const storeContainer of game.stores) {
        const store = storeContainer.store;
        entity.stores.push(
          await this.storesService.getOrCreateStore(store.name, store.id),
        );
      }
    } catch (error) {
      this.logger.error(error, "Error mapping stores to entity");
    }
    return entity;
  }

  /**
   * Maps developers from RawgGame to Game entity.
   *
   * @param game - The RawgGame object containing the developers information.
   * @param entity - The Game entity to update with the developers information.
   * @returns The updated Game entity.
   */
  private async mapDevelopersToEntity(
    game: RawgGame,
    entity: Game,
  ): Promise<Game> {
    try {
      entity.developers = [];
      if (!game.developers) return entity;
      for (const developer of game.developers) {
        entity.developers.push(
          await this.developersService.getOrCreateDeveloper(
            developer.name,
            developer.id,
          ),
        );
      }
    } catch (error) {
      this.logger.error(error, "Error mapping developers to entity");
    }
    return entity;
  }

  /**
   * Maps publishers from RawgGame to Game entity.
   *
   * @param game - The RawgGame object.
   * @param entity - The Game entity.
   * @returns The updated Game entity.
   */
  private async mapPublishersToEntity(
    game: RawgGame,
    entity: Game,
  ): Promise<Game> {
    try {
      entity.publishers = [];
      if (!game.publishers) return entity;
      for (const publisher of game.publishers) {
        entity.publishers.push(
          await this.publishersService.getOrCreatePublisher(
            publisher.name,
            publisher.id,
          ),
        );
      }
    } catch (error) {
      this.logger.error(error, "Error mapping publishers to entity");
    }
    return entity;
  }

  /**
   * Maps tags from RawgGame to Game entity. Only English tags are mapped.
   *
   * @param game - The RawgGame object.
   * @param entity - The Game entity.
   * @returns The updated Game entity.
   */
  private async mapTagsToEntity(game: RawgGame, entity: Game): Promise<Game> {
    try {
      entity.tags = [];

      if (!game.tags) {
        return entity;
      }

      for (const tag of game.tags) {
        const isEnglish = tag.language === "eng";
        const isAlphanumeric = /^[a-zA-Z0-9\s&.,-]+$/.test(tag.name);

        if (!isEnglish) {
          this.logger.debug(
            `Skipping tag "${tag.name}" (invalid language: ${tag.language})`,
          );
        } else if (!isAlphanumeric) {
          this.logger.debug(`Skipping tag "${tag.name}" (invalid characters)`);
        } else {
          entity.tags.push(
            await this.tagService.getOrCreateTag(tag.name, tag.id),
          );
        }
      }
    } catch (error) {
      this.logger.error(error, "Error mapping tags to entity");
    }

    return entity;
  }

  /**
   * Maps genres from RawgGame to Game entity.
   *
   * @param game - The RawgGame object.
   * @param entity - The Game entity.
   * @returns The updated Game entity.
   */
  private async mapGenresToEntity(game: RawgGame, entity: Game): Promise<Game> {
    try {
      entity.genres = [];
      if (!game.genres) return entity;
      for (const genre of game.genres) {
        entity.genres.push(
          await this.genreService.getOrCreateGenre(genre.name, genre.id),
        );
      }
    } catch (error) {
      this.logger.error(error, "Error mapping genres to entity");
    }
    return entity;
  }

  /**
   * Maps a RawgGame object to a Game entity.
   *
   * @param game - The RawgGame object to map.
   * @param entity - The Game entity to update.
   * @returns The updated Game entity.
   */
  private async mapRawgGameToEntity(
    game: RawgGame,
    entity: Game,
  ): Promise<Game> {
    try {
      try {
        entity.background_image =
          (await this.imagesService.downloadImage(game.background_image)) ??
          entity.background_image;
      } catch (error) {}

      entity.rawg_title = game.name ?? entity.rawg_title;
      entity.rawg_id = game.id ?? entity.rawg_id;
      entity.description = game.description_raw ?? entity.description;
      entity.website_url = game.website ?? entity.website_url;
      entity.metacritic_rating = game.metacritic ?? entity.metacritic_rating;

      entity.rawg_release_date =
        this.getReleaseDate(game) ?? entity.rawg_release_date;

      if (game.playtime) {
        entity.average_playtime = game.playtime * 60;
      }

      return entity;
    } catch (error) {
      this.logger.error(error, "Error mapping rawg game to entity");
      throw error;
    }
  }

  /**
   * Returns the release date for a RawgGame object or null if it is not
   * available.
   *
   * @param game - The RawgGame object to get the release date for.
   * @returns The release date for the RawgGame object, or null if it is not
   *   available.
   */
  private getReleaseDate(game: RawgGame): Date | null {
    const pcReleaseDate = game.platforms.find((p) => p.platform.id === 4)
      ?.released_at;
    const generalReleaseDate = game.released;

    if (pcReleaseDate) {
      return new Date(pcReleaseDate);
    }

    if (generalReleaseDate) {
      return new Date(generalReleaseDate);
    }

    return null;
  }
}
