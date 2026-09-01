import { Injectable, NotFoundException } from "@nestjs/common";
import {
  fields,
  igdb,
  proto as igdbModels,
  search,
  twitchAccessToken,
  where,
  whereIn,
} from "@phalcode/ts-igdb-client";
import lodash from "lodash";

import { isNumberString } from "class-validator";
import configuration from "../../../../configuration.js";
import { DeveloperMetadata } from "../../developers/developer.metadata.entity.js";
import { GameMetadata } from "../../games/game.metadata.entity.js";
import { MinimalGameMetadataDto } from "../../games/minimal-game.metadata.dto.js";
import { GenreMetadata } from "../../genres/genre.metadata.entity.js";
import { PublisherMetadata } from "../../publishers/publisher.metadata.entity.js";
import { TagMetadata } from "../../tags/tag.metadata.entity.js";
import { MetadataProvider } from "../abstract.metadata-provider.service.js";
import { GameVaultIgdbAgeRatingMap } from "./models/gamevault-igdb-age-rating.map.js";
const { isEmpty, toLower } = lodash;

@Injectable()
export class IgdbMetadataProviderService extends MetadataProvider {
  enabled = configuration.METADATA.IGDB.ENABLED;
  request_interval_ms = configuration.METADATA.IGDB.REQUEST_INTERVAL_MS;
  readonly slug = "igdb";
  readonly name = "IGDB";
  readonly priority = configuration.METADATA.IGDB.PRIORITY;
  readonly fieldsToInclude = [
    "*",
    "age_ratings.*",
    "age_ratings.organization.*",
    "age_ratings.rating_category.*",
    "age_ratings.rating_category.organization.*",
    "cover.*",
    "genres.*",
    "game_status.*",
    "involved_companies.*",
    "involved_companies.company.*",
    "keywords.*",
    "screenshots.*",
    "artworks.*",
    "videos.*",
    "themes.*",
    "websites.*",
  ];

  readonly gameTypesToInclude = [
    0, // Main Game
    3, // Bundle
    4, // Standalone Expansion
    6, // Episode
    7, // Season
    8, // Remake
    9, // Remaster
    10, // Expanded Game
    11, // Port
    12, // Fork
  ];

  override async onModuleInit(): Promise<void> {
    if (
      !configuration.METADATA.IGDB.CLIENT_ID ||
      !configuration.METADATA.IGDB.CLIENT_SECRET
    ) {
      this.enabled = false;
      this.logger.warn({
        message:
          "IGDB Metadata Provider is disabled because METADATA_IGDB_CLIENT_ID or METADATA_IGDB_CLIENT_SECRET is not set.",
      });
      return;
    }
    super.onModuleInit();
  }

  public override async search(
    query: string,
  ): Promise<MinimalGameMetadataDto[]> {
    const client = await this.getClient();

    const found_games = [];

    if (isNumberString(query)) {
      const searchById = await client
        .request("games")
        .pipe(
          fields([
            "id",
            "name",
            "summary",
            "storyline",
            "first_release_date",
            "cover.*",
          ]),
          where("id", "=", Number(query)),
        )
        .execute();
      found_games.push(...searchById.data);
    }

    const searchByName = await client
      .request("games")
      .pipe(
        fields([
          "id",
          "name",
          "summary",
          "storyline",
          "first_release_date",
          "cover.*",
        ]),
        search(query),
        whereIn("game_type", this.gameTypesToInclude),
      )
      .execute();

    found_games.push(...searchByName.data);

    this.logger.debug({
      message: `Found ${found_games.length} games on IGDB`,
      query,
      count: found_games.length,
      games: found_games,
    });

    const minimalGameMetadata = [];
    for (const game of found_games) {
      minimalGameMetadata.push(
        await this.mapMinimalGameMetadata(game as igdbModels.IGame),
      );
    }
    return minimalGameMetadata;
  }

  public override async getByProviderDataIdOrFail(
    provider_data_id: string,
  ): Promise<GameMetadata> {
    const gameResult = await (
      await this.getClient()
    )
      .request("games")
      .pipe(
        fields(this.fieldsToInclude as any),
        where("id", "=", Number(provider_data_id)),
      )
      .execute();

    if (isEmpty(gameResult.data))
      throw new NotFoundException(
        `Game with id ${provider_data_id} not found on IGDB.`,
      );

    const averagePlaytime = await this.fetchAveragePlaytime(
      Number(provider_data_id),
    );

    return this.mapGameMetadata(
      gameResult.data[0] as igdbModels.IGame,
      averagePlaytime,
    );
  }

  private async mapGameMetadata(
    game: igdbModels.IGame,
    averagePlaytime?: number,
  ): Promise<GameMetadata> {
    const releaseDate = this.parseReleaseDate(game.first_release_date);

    return {
      age_rating: this.calculateAverageAgeRating(game.age_ratings, game.name),
      average_playtime: averagePlaytime,
      provider_slug: this.slug,
      provider_data_id: game.id?.toString(),
      provider_data_url: game.url,
      title: game.name,
      release_date: releaseDate,
      description:
        game.summary && game.storyline
          ? `${game.summary}\n\n${game.storyline}`
          : game.summary || game.storyline || null,
      rating: game.total_rating,
      url_websites: game.websites?.map((website) => website.url),
      early_access: ["alpha", "beta", "early access"].includes(
        game.game_status?.status?.toLowerCase(),
      ),
      url_screenshots: [
        ...(game.screenshots || []),
        ...(game.artworks || []),
      ].map((image) => this.replaceUrl(image.url, "t_thumb", "t_1080p_2x")),
      url_trailers: game.videos
        ?.filter((video) =>
          ["trailer", "teaser", "intro", "showcase", "preview"].some((word) =>
            toLower(video.name).includes(word),
          ),
        )
        .map((video) => `https://www.youtube.com/watch?v=${video.video_id}`),
      url_gameplays: game.videos
        ?.filter((video) =>
          ["gameplay", "playthrough", "demo"].some((word) =>
            toLower(video.name).includes(word),
          ),
        )
        .map((video) => `https://www.youtube.com/watch?v=${video.video_id}`),
      developers: (game.involved_companies || [])
        .filter((company) => company.developer)
        .map(
          (company) =>
            ({
              provider_slug: "igdb",
              provider_data_id: company.company.id.toString(),
              name: company.company.name,
            }) as DeveloperMetadata,
        ),
      publishers: (game.involved_companies || [])
        .filter((company) => company.publisher)
        .map(
          (company) =>
            ({
              provider_slug: "igdb",
              provider_data_id: company.company.id.toString(),
              name: company.company.name,
            }) as PublisherMetadata,
        ),
      genres: (game.genres || []).map(
        (genre) =>
          ({
            provider_slug: "igdb",
            provider_data_id: genre.id.toString(),
            name: genre.name,
          }) as GenreMetadata,
      ),
      tags: [
        ...(game.keywords || []).map(
          (keyword) =>
            ({
              provider_slug: "igdb",
              provider_data_id: keyword.id.toString(),
              name: keyword.name,
            }) as TagMetadata,
        ),
        ...(game.themes || []).map(
          (theme) =>
            ({
              provider_slug: "igdb",
              provider_data_id: theme.id.toString(),
              name: theme.name,
            }) as TagMetadata,
        ),
      ],
      cover: await this.downloadImage(
        game.cover?.url,
        "t_thumb",
        "t_cover_big_2x",
      ),
      background: await this.downloadImage(
        game.artworks?.[0]?.url,
        "t_thumb",
        "t_1080p_2x",
      ),
    } as GameMetadata;
  }

  private async mapMinimalGameMetadata(
    game: igdbModels.IGame,
  ): Promise<MinimalGameMetadataDto> {
    return {
      provider_slug: "igdb",
      provider_data_id: game.id?.toString(),
      title: game.name,
      description: game.summary || game.storyline || null,
      release_date: this.parseReleaseDate(game.first_release_date),
      cover_url: this.replaceUrl(game.cover?.url, "t_thumb", "t_cover_big_2x"),
    } as MinimalGameMetadataDto;
  }

  private parseReleaseDate(
    releaseDate:
      igdbModels.IGame["first_release_date"] | number | null | undefined,
  ): Date | undefined {
    const seconds =
      typeof releaseDate === "number"
        ? releaseDate
        : typeof releaseDate?.seconds === "number"
          ? releaseDate.seconds
          : undefined;

    if (seconds === undefined) {
      return undefined;
    }

    const parsedDate = new Date(seconds * 1000);
    return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
  }

  private async getClient() {
    const token = await twitchAccessToken({
      client_id: configuration.METADATA.IGDB.CLIENT_ID,
      client_secret: configuration.METADATA.IGDB.CLIENT_SECRET,
    });
    return igdb(configuration.METADATA.IGDB.CLIENT_ID, token);
  }

  private async fetchAveragePlaytime(
    gameId: number,
  ): Promise<number | undefined> {
    try {
      const client = await this.getClient();
      const result = await client
        .request("game_time_to_beats" as any)
        .pipe(fields(["normally"] as any), where("game_id", "=", gameId))
        .execute();

      const timeToBeat = result.data?.[0] as
        igdbModels.IGameTimeToBeat | undefined;

      if (timeToBeat?.normally) {
        const minutes = Math.round(timeToBeat.normally / 60);
        this.logger.debug({
          message: `Fetched time to beat from IGDB.`,
          gameId,
          normallySeconds: timeToBeat.normally,
          normallyMinutes: minutes,
        });
        return minutes;
      }

      return undefined;
    } catch (error) {
      this.logger.warn({
        message: `Failed to fetch time to beat from IGDB.`,
        gameId,
        error,
      });
      return undefined;
    }
  }

  private replaceUrl(url: string, from: string, to: string) {
    if (!url) return undefined;
    return url.replace("//", "https://").replace(from, to);
  }

  private async downloadImage(url?: string, from?: string, to?: string) {
    if (!url) return undefined;
    try {
      return await this.mediaService.downloadByUrl(
        this.replaceUrl(url, from, to),
      );
    } catch (error) {
      this.logger.error(`Failed to download image from ${url}:`, error);
      return undefined;
    }
  }

  private calculateAverageAgeRating(
    ageRatings: igdbModels.IAgeRating[],
    gameTitle: string = "Unknown Game",
  ): number {
    if (isEmpty(ageRatings)) {
      this.logger.debug({
        message: `No age ratings found.`,
        gameTitle,
      });
      return undefined;
    }

    const ages = ageRatings
      .map((rating) =>
        GameVaultIgdbAgeRatingMap.find(
          (entry) =>
            entry.ratingName.toLowerCase() ===
            rating.rating_category?.rating?.toLowerCase(),
        ),
      )
      .filter((entry) => entry != null)
      .map((entry) => {
        this.logger.debug({
          message: `Determined age rating.`,
          gameTitle,
          ageRating: entry,
        });
        return entry.minAge;
      });

    if (ages?.length === 0) {
      this.logger.debug({
        message: `No age ratings found.`,
        gameTitle,
      });
      return undefined;
    }

    const averageAge = Math.round(
      ages.reduce((sum, age) => sum + age, 0) / ages.length,
    );
    this.logger.debug({
      message: `Calculated average age rating.`,
      gameTitle,
      ages,
      averageAge,
    });

    return averageAge;
  }
}
