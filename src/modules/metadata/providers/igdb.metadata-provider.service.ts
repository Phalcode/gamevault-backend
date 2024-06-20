import { Injectable } from "@nestjs/common";
import { and, fields, igdb, twitchAccessToken, where } from "ts-igdb-client";

import configuration from "../../../configuration";
import { GamevaultGame } from "../../games/game.entity";
import { GameMetadata } from "../games/game.metadata.entity";
import { MetadataProvider } from "./abstract.metadata-provider.service";

@Injectable()
export class IgdbMetadataProviderService extends MetadataProvider {
  enabled = configuration.METADATA.IGDB.ENABLED;
  slug = configuration.METADATA.IGDB.SLUG;
  priority = configuration.METADATA.IGDB.PRIORITY;

  public async search(game: GamevaultGame): Promise<GameMetadata[]> {
    const games = await (
      await this.getClient()
    )
      .request("games")
      .pipe(fields("*"), where("name", "=", game.title))
      .execute();

    this.logger.log({
      message: "Found Games on IGDB",
      search: game.title,
      count: games.data.length,
      games: games.data,
    });

    //TODO: Map Metadata
    return [];
  }
  public async update(game: GameMetadata): Promise<GameMetadata> {
    const update = await (
      await this.getClient()
    )
      .request("games")
      .pipe(
        fields("*"),
        and(
          where("id", "=", game.metadata_provider_id),
          where("checksum", "!=", game.provider_checksum),
        ),
      )
      .execute();
    //TODO: Map Metadata
    return game;
  }

  private async getClient() {
    // TODO: Do we really need to authenticate each request?
    const token = await twitchAccessToken({
      client_id: configuration.METADATA.IGDB.CLIENT_ID,
      client_secret: configuration.METADATA.IGDB.CLIENT_SECRET,
    });

    return igdb(configuration.METADATA.IGDB.CLIENT_ID, token);
  }
}
