import { Injectable, NotFoundException } from "@nestjs/common";

import configuration from "../../../../configuration";
import { GameMetadata } from "../../games/game.metadata.entity";
import { MinimalGameMetadataDto } from "../../games/minimal-game.metadata.dto";
import { MetadataProvider } from "../abstract.metadata-provider.service";

@Injectable()
export class RawgLegacyMetadataProviderService extends MetadataProvider {
  readonly enabled = configuration.METADATA.RAWG_LEGACY.ENABLED;
  readonly priority = configuration.METADATA.RAWG_LEGACY.PRIORITY;
  readonly slug = "rawg-legacy";
  readonly name = "RAWG (Legacy)";
  readonly noopMessage =
    "The RAWG (Legacy) Metadata Provider does not support this functionality. It is designed solely for compatibility with data of GameVault instances below version 13.0.0.";

  public override async register() {
    this.metadataService.registerProvider(this);
  }

  public override async search(
    query: string,
  ): Promise<MinimalGameMetadataDto[]> {
    this.logger.debug({
      message: this.noopMessage,
      operation: "search",
      query,
    });
    return [];
  }

  public override async getByProviderDataIdOrFail(
    provider_data_id: string,
  ): Promise<GameMetadata> {
    this.logger.debug({
      message: this.noopMessage,
      operation: "getByProviderDataIdOrFail",
      provider_data_id,
    });
    throw new NotFoundException({
      message: this.noopMessage,
    });
  }
}
