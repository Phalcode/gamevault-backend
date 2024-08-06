import { Injectable, NotFoundException } from "@nestjs/common";
import { Builder } from "builder-pattern";
import {
  fields,
  igdb,
  search,
  twitchAccessToken,
  where,
  whereIn,
} from "ts-igdb-client";

import configuration from "../../../../configuration";
import { DeveloperMetadata } from "../../developers/developer.metadata.entity";
import { GameMetadata } from "../../games/game.metadata.entity";
import { MinimalGameMetadataDto } from "../../games/minimal-game.metadata.dto";
import { GenreMetadata } from "../../genres/genre.metadata.entity";
import { TagMetadata } from "../../tags/tag.metadata.entity";
import { MetadataProvider } from "../abstract.metadata-provider.service";
import { IgdbGame } from "./models/igdb-game.interface";
import { IgdbGameCategory } from "./models/igdb-game-category.enum";
import { IgdbGameStatus } from "./models/igdb-game-status.enum";

@Injectable()
export class IgdbMetadataProviderService extends MetadataProvider {
  enabled = configuration.METADATA.IGDB.ENABLED;
  slug = "igdb";
  name = "IGDB";
  priority = configuration.METADATA.IGDB.PRIORITY;
  fieldsToInclude = [
    "*",
    "cover.*",
    "external_games.*",
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
  categoriesToInclude = [
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
    const games = await (
      await this.getClient()
    )
      .request("games")
      .pipe(
        fields(["id", "name", "first_release_date", "cover.*"]),
        search(query),
        whereIn("category", this.categoriesToInclude),
      )
      .execute();

    this.logger.debug({
      message: `Found ${games.data.length} games on IGDB`,
      query,
      count: games.data.length,
      games: games.data,
    });

    const minimalGameMetadata = [];
    for (const game of games.data) {
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

  private async getClient() {
    const token = await twitchAccessToken({
      client_id: configuration.METADATA.IGDB.CLIENT_ID,
      client_secret: configuration.METADATA.IGDB.CLIENT_SECRET,
    });

    return igdb(configuration.METADATA.IGDB.CLIENT_ID, token);
  }

  private async mapGameMetadata(game: IgdbGame): Promise<GameMetadata> {
    return Builder<GameMetadata>()
      .provider_slug(this.slug)
      .provider_data_id(game.id?.toString())
      .provider_data_url(game.url)
      .title(game.name)
      .release_date(new Date(game.first_release_date * 1000))
      .description(
        game.summary && game.storyline
          ? `${game.summary}\n\n${game.storyline}`
          : game.summary || game.storyline || null,
      )
      .rating(game.total_rating)
      .url_websites(game.websites.map((website) => website.url))
      .early_access(
        [
          IgdbGameStatus.alpha,
          IgdbGameStatus.beta,
          IgdbGameStatus.early_access,
        ].includes(game.status),
      )
      .url_screenshots(
        [...(game.screenshots || []), ...(game.artworks || [])].map((image) =>
          image.url.replace("//", "https://").replace("t_thumb", "t_1080p_2x"),
        ),
      )
      .url_trailers(
        game.videos
          ?.filter((video) =>
            ["trailer", "teaser", "intro"].some((word) =>
              video.name.toLowerCase().includes(word),
            ),
          )
          .map((video) => `https://www.youtube.com/watch?v=${video.video_id}`),
      )
      .url_gameplays(
        game.videos
          ?.filter((video) =>
            ["gameplay"].some((word) =>
              video.name.toLowerCase().includes(word),
            ),
          )
          .map((video) => `https://www.youtube.com/watch?v=${video.video_id}`),
      )
      .developers(
        (game.involved_companies || [])
          .filter((involved_company) => involved_company.developer)
          .map((involved_company) => {
            return Builder<DeveloperMetadata>()
              .provider_slug("igdb")
              .provider_data_id(involved_company.company.id.toString())
              .name(involved_company.company.name)
              .build();
          }),
      )
      .publishers(
        (game.involved_companies || [])
          .filter((involved_company) => involved_company.publisher)
          .map((involved_company) => {
            return Builder<DeveloperMetadata>()
              .provider_slug("igdb")
              .provider_data_id(involved_company.company.id.toString())
              .name(involved_company.company.name)
              .build();
          }),
      )
      .genres(
        (game.genres || []).map((genre) => {
          return Builder<GenreMetadata>()
            .provider_slug("igdb")
            .provider_data_id(genre.id.toString())
            .name(genre.name)
            .build();
        }),
      )
      .tags([
        ...(game.keywords || []).map((keyword) => {
          return Builder<TagMetadata>()
            .provider_slug("igdb")
            .provider_data_id(keyword.id.toString())
            .name(keyword.name)
            .build();
        }),
        ...(game.themes || []).map((theme) => {
          return Builder<TagMetadata>()
            .provider_slug("igdb")
            .provider_data_id(theme.id.toString())
            .name(theme.name)
            .build();
        }),
      ])
      .cover(
        game.cover
          ? await this.mediaService.downloadByUrl(
              game.cover?.url
                .replace("//", "https://")
                .replace("t_thumb", "t_cover_big_2x"),
            )
          : undefined,
      )
      .background(
        game.artworks?.[0]
          ? await this.mediaService.downloadByUrl(
              game.artworks?.[0]?.url
                .replace("//", "https://")
                .replace("t_thumb", "t_1080p_2x"),
            )
          : undefined,
      )
      .build();
  }

  private async mapMinimalGameMetadata(
    game: IgdbGame,
  ): Promise<MinimalGameMetadataDto> {
    return Builder<MinimalGameMetadataDto>()
      .provider_slug("igdb")
      .provider_data_id(game.id?.toString())
      .title(game.name)
      .description(
        game.summary && game.storyline
          ? `${game.summary}\n\n${game.storyline}`
          : game.summary || game.storyline || null,
      )
      .release_date(new Date(game.first_release_date * 1000))
      .cover_url(
        game.cover?.url
          .replace("//", "https://")
          .replace("t_thumb", "t_cover_big_2x"),
      )
      .build();
  }
}
