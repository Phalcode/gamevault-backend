import { Injectable, NotFoundException } from "@nestjs/common";
import {
  fields,
  igdb,
  search,
  twitchAccessToken,
  where,
  whereIn,
} from "ts-igdb-client";

import { isNumberString } from "class-validator";
import { isEmpty, toLower } from "lodash";
import configuration from "../../../../configuration";
import { DeveloperMetadata } from "../../developers/developer.metadata.entity";
import { GameMetadata } from "../../games/game.metadata.entity";
import { MinimalGameMetadataDto } from "../../games/minimal-game.metadata.dto";
import { GenreMetadata } from "../../genres/genre.metadata.entity";
import { PublisherMetadata } from "../../publishers/publisher.metadata.entity";
import { TagMetadata } from "../../tags/tag.metadata.entity";
import { MetadataProvider } from "../abstract.metadata-provider.service";
import {
  GameVaultIgdbAgeRatingMap,
  IgdbAgeRating,
} from "./models/igdb-age-rating.interface";
import { IgdbGameCategory } from "./models/igdb-game-category.enum";
import { IgdbGameStatus } from "./models/igdb-game-status.enum";
import { IgdbGame } from "./models/igdb-game.interface";

@Injectable()
export class IgdbMetadataProviderService extends MetadataProvider {
  enabled = configuration.METADATA.IGDB.ENABLED;
  readonly slug = "igdb";
  readonly name = "IGDB";
  readonly priority = configuration.METADATA.IGDB.PRIORITY;
  readonly fieldsToInclude = [
    "*",
    "age_ratings.*",
    "cover.*",
    "genres.*",
    "involved_companies.*",
    "involved_companies.company.*",
    "keywords.*",
    "screenshots.*",
    "artworks.*",
    "videos.*",
    "themes.*",
    "websites.*",
  ];
  readonly categoriesToInclude = [
    IgdbGameCategory.main_game,
    IgdbGameCategory.standalone_expansion,
    IgdbGameCategory.episode,
    IgdbGameCategory.season,
    IgdbGameCategory.remake,
    IgdbGameCategory.remaster,
    IgdbGameCategory.expanded_game,
    IgdbGameCategory.port,
    IgdbGameCategory.fork,
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

    const searchByName = await client
      .request("games")
      .pipe(
        fields(["id", "name", "first_release_date", "cover.*"]),
        search(query),
        whereIn("category", this.categoriesToInclude),
      )
      .execute();

    found_games.push(...searchByName.data);

    if (isNumberString(query)) {
      const searchById = await client
        .request("games")
        .pipe(
          fields(["id", "name", "first_release_date", "cover.*"]),
          where("id", "=", Number(query)),
        )
        .execute();
      found_games.push(...searchById.data);
    }

    this.logger.debug({
      message: `Found ${found_games.length} games on IGDB`,
      query,
      count: found_games.length,
      games: found_games,
    });

    const minimalGameMetadata = [];
    for (const game of found_games) {
      minimalGameMetadata.push(
        await this.mapMinimalGameMetadata(game as IgdbGame),
      );
    }
    return minimalGameMetadata;
  }

  public override async getByProviderDataIdOrFail(
    provider_data_id: string,
  ): Promise<GameMetadata> {
    try {
      const update = await (
        await this.getClient()
      )
        .request("games")
        .pipe(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fields(this.fieldsToInclude as any),
          where("id", "=", Number(provider_data_id)),
        )
        .execute();
      return this.mapGameMetadata(update.data[0] as IgdbGame);
    } catch (error) {
      throw new NotFoundException({
        message: "Game not found on IGDB",
        provider_data_id,
      });
    }
  }

  private async mapGameMetadata(game: IgdbGame): Promise<GameMetadata> {
    return {
      age_rating: this.calculateAverageAgeRating(game.name, game.age_ratings),
      provider_slug: this.slug,
      provider_data_id: game.id?.toString(),
      provider_data_url: game.url,
      title: game.name,
      release_date: isNaN(new Date(game.first_release_date * 1000).getTime())
        ? undefined
        : new Date(game.first_release_date * 1000),
      description:
        game.summary && game.storyline
          ? `${game.summary}\n\n${game.storyline}`
          : game.summary || game.storyline || null,
      rating: game.total_rating,
      url_websites: game.websites?.map((website) => website.url),
      early_access: [
        IgdbGameStatus.alpha,
        IgdbGameStatus.beta,
        IgdbGameStatus.early_access,
      ].includes(game.status),
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
    game: IgdbGame,
  ): Promise<MinimalGameMetadataDto> {
    return {
      provider_slug: "igdb",
      provider_data_id: game.id?.toString(),
      title: game.name,
      description:
        game.summary && game.storyline
          ? `${game.summary}\n\n${game.storyline}`
          : game.summary || game.storyline || null,
      release_date: new Date(game.first_release_date * 1000),
      cover_url: this.replaceUrl(game.cover?.url, "t_thumb", "t_cover_big_2x"),
    } as MinimalGameMetadataDto;
  }

  private async getClient() {
    const token = await twitchAccessToken({
      client_id: configuration.METADATA.IGDB.CLIENT_ID,
      client_secret: configuration.METADATA.IGDB.CLIENT_SECRET,
    });

    return igdb(configuration.METADATA.IGDB.CLIENT_ID, token);
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
    gameTitle: string,
    ageRatings: IgdbAgeRating[],
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
          (entry) => entry.igdbEnumValue === rating.rating,
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
