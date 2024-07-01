import { Injectable, NotFoundException } from "@nestjs/common";
import { Builder } from "builder-pattern";
import { writeFileSync } from "fs";
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
import { GameMetadataType } from "../../games/game-metadata-type.enum";
import { GameMetadata } from "../../games/game.metadata.entity";
import { MetadataProvider } from "../abstract.metadata-provider.service";
import { IGDBGameCategories } from "./models/game-categories.enum";

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
    "keywords.*",
    "screenshots.*",
    "videos.*",
    "themes.*",
    "websites.*",
  ];
  categoriesToInclude = [
    IGDBGameCategories.MainGame,
    IGDBGameCategories.StandaloneExpansion,
    IGDBGameCategories.Episode,
    IGDBGameCategories.Season,
    IGDBGameCategories.Remake,
    IGDBGameCategories.Remaster,
    IGDBGameCategories.ExpandedGame,
    IGDBGameCategories.Port,
    IGDBGameCategories.Fork,
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

    if (games.data.length === 0) {
      return [];
    }

    return games.data.map((game) => this.mapGame(game));
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
      return this.mapGame(update.data[0]);
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

  private mapGame(game: unknown): GameMetadata {
    //write json to file
    writeFileSync("igdb.json", JSON.stringify(game, null, 2));
    return Builder<GameMetadata>()
      .title(game["name"])
      .provider_slug("igdb")
      .provider_data_id(game["id"])
      .type(GameMetadataType.PROVIDER)
      .build();
  }
}
