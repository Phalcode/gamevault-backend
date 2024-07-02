import { Injectable, NotFoundException } from "@nestjs/common";
import { Builder } from "builder-pattern";
import {
  and,
  fields,
  igdb,
  search,
  twitchAccessToken,
  where,
  whereIn,
} from "ts-igdb-client";

import configuration from "../../../../configuration";
import { GamevaultGame } from "../../../games/gamevault-game.entity";
import { DeveloperMetadata } from "../../developers/developer.metadata.entity";
import { GameMetadataType } from "../../games/game-metadata-type.enum";
import { GameMetadata } from "../../games/game.metadata.entity";
import { GenreMetadata } from "../../genres/genre.metadata.entity";
import { TagMetadata } from "../../tags/tag.metadata.entity";
import { MetadataProvider } from "../abstract.metadata-provider.service";
import { IgdbGameCategory } from "./models/igdb-game-category.enum";
import { IgdbGameStatus } from "./models/igdb-game-status.enum";
import { IgdbGame } from "./models/igdb-game.interface";

@Injectable()
export class IgdbMetadataProviderService extends MetadataProvider {
  enabled = configuration.METADATA.IGDB.ENABLED;
  slug = configuration.METADATA.IGDB.SLUG;
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

  public override async search(game: GamevaultGame): Promise<GameMetadata[]> {
    const games = await (
      await this.getClient()
    )
      .request("games")
      .pipe(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fields(this.fieldsToInclude as any),
        search(game.title),
        whereIn("category", this.categoriesToInclude),
      )
      .execute();

    this.logger.log({
      message: `Found ${games.data.length} games on IGDB`,
      search: game.title,
      count: games.data.length,
      games: games.data,
    });

    const metadata = [];
    for (const game of games.data) {
      metadata.push(await this.mapGame(game as IgdbGame));
    }
    return metadata;
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
          and(where("id", "=", provider_data_id)),
        )
        .execute();
      return this.mapGame(update.data[0] as IgdbGame);
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

  private async mapGame(game: IgdbGame): Promise<GameMetadata> {
    return Builder<GameMetadata>()
      .type(GameMetadataType.PROVIDER)
      .provider_slug("igdb")
      .provider_data_id(game.id.toString())
      .provider_checksum(game.checksum)
      .title(game.name)
      .release_date(new Date(game.first_release_date))
      .description(`${game.summary} \n\n\n ${game.storyline}`)
      .rating_provider(game.total_rating)
      .url_website(game.websites[0]?.url)
      .early_access(
        [
          IgdbGameStatus.alpha,
          IgdbGameStatus.beta,
          IgdbGameStatus.early_access,
        ].includes(game.status),
      )
      .developers(
        game.involved_companies
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
        game.involved_companies
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
        game.genres.map((genre) => {
          return Builder<GenreMetadata>()
            .provider_slug("igdb")
            .provider_data_id(genre.id.toString())
            .name(genre.name)
            .build();
        }),
      )
      .tags([
        ...game.keywords.map((keyword) => {
          return Builder<TagMetadata>()
            .provider_slug("igdb")
            .provider_data_id(keyword.id.toString())
            .name(keyword.name)
            .build();
        }),
        ...game.themes.map((theme) => {
          return Builder<TagMetadata>()
            .provider_slug("igdb")
            .provider_data_id(theme.id.toString())
            .name(theme.name)
            .build();
        }),
      ])
      .screenshots(
        await Promise.all([
          ...game.screenshots.map(async (screenshot) => {
            return await this.mediaService.downloadByUrl(
              screenshot.url.replace("t_thumb", "t_1080p_2x"),
            );
          }),
          ...game.artworks.map(async (artwork) => {
            return await this.mediaService.downloadByUrl(
              artwork.url.replace("t_thumb", "t_1080p_2x"),
            );
          }),
        ]),
      )
      .cover(
        await this.mediaService.downloadByUrl(
          game.cover.url.replace("t_thumb", "t_1080p_2x"),
        ),
      )
      .background(
        await this.mediaService.downloadByUrl(
          game.artworks[0].url.replace("t_thumb", "t_1080p_2x"),
        ),
      )
      .build();
  }
}
