import { Injectable } from "@nestjs/common";

import { GamevaultGame } from "../games/game.entity";
import { MetadataProvider } from "./providers/abstract.metadata-provider.service";

@Injectable()
export class MetadataService {
  providers: MetadataProvider[] = [];

  constructor() {}

  registerProvider(provider: MetadataProvider) {
    this.providers.push(provider);
  }

  getProviderBySlug(slug: string) {
    return this.providers.find((provider) => provider.slug === slug);
  }

  getMetadata(game: GamevaultGame) {
    // TODO: get metadata from providers, sort and fill gaps by priority, and save a gamevault entry
  }

  refreshMetadata(game: GamevaultGame, providerSlug?: string) {
    // TODO: for each gamemetadata, refresh it using the provider
  }

  unmapMetadata(game: GamevaultGame, providerSlug?: string) {
    // TODO: clear effective metadata and remove each metadata from the game except user
  }

  remapMetadata(
    game: GamevaultGame,
    providerSlug: string,
    newProviderId: string,
  ) {}

  private getBestMatchingGame;
}
