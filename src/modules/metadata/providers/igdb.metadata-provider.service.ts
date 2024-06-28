import { Injectable } from "@nestjs/common";
import { Builder } from "builder-pattern";
import { and, fields, igdb, twitchAccessToken, where } from "ts-igdb-client";

import configuration from "../../../configuration";
import { GamevaultGame } from "../../games/gamevault-game.entity";
import { GameMetadataType } from "../games/game-metadata-type.enum";
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

    return games.data.map((game) => this.mapGame(game));
  }
  public async getByProviderDataId(
    provider_data_id: string,
  ): Promise<GameMetadata> {
    const update = await (
      await this.getClient()
    )
      .request("games")
      .pipe(fields("*"), and(where("id", "=", provider_data_id)))
      .execute();
    return this.mapGame(update.data[0]);
  }

  private async getClient() {
    // TODO: Do we really need to authenticate each request?
    const token = await twitchAccessToken({
      client_id: configuration.METADATA.IGDB.CLIENT_ID,
      client_secret: configuration.METADATA.IGDB.CLIENT_SECRET,
    });

    return igdb(configuration.METADATA.IGDB.CLIENT_ID, token);
  }

  private mapGame(game: any): GameMetadata {
    // TODO: The data is pretty incomplete and we need to dereference the objects.
    return Builder<GameMetadata>()
      .title(game.name)
      .provider_slug("igdb")
      .provider_data_id(game.id)
      .type(GameMetadataType.PROVIDER)
      .build();
  }
}
