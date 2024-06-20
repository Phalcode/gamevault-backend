import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  NotImplementedException,
} from "@nestjs/common";

import { validateOrReject } from "class-validator";
import { GamevaultGame } from "../games/game.entity";
import { GameMetadata } from "./games/game.metadata.entity";
import { MetadataProvider } from "./providers/abstract.metadata-provider.service";

@Injectable()
export class MetadataService {
  private readonly logger = new Logger(this.constructor.name);
  providers: MetadataProvider[] = [];

  registerProvider(provider: MetadataProvider) {
    const existingProvider = this.providers.find(
      (p) => p.slug === provider.slug || p.priority === provider.priority,
    );

    if (existingProvider) {
      const errorMessage =
        `There is already a provider (${existingProvider.slug}) with the ` +
        (provider.slug === existingProvider.slug
          ? `same slug (${provider.slug})`
          : `same priority (${provider.priority})`);
      throw new ConflictException(errorMessage);
    }

    validateOrReject(provider).catch((errors) => {
      throw new InternalServerErrorException(errors);
    });

    this.providers.push(provider);
    this.providers.sort((a, b) => b.priority - a.priority);

    this.logger.log({
      message: `Registered metadata provider.`,
      slug: provider.slug,
      priority: provider.priority,
    });
  }

  getProviderBySlugOrFail(slug: string) {
    const provider = this.providers.find((provider) => provider.slug === slug);
    if (!provider) {
      throw new NotFoundException(
        `There is no registered provider with slug "${slug}".`,
      );
    }
    return provider;
  }

  getMultiMetadata(games: GamevaultGame[]) {
    for (const game of games) {
      this.getMetadata(game);
    }
  }

  getMetadata(game: GamevaultGame) {
    // TODO: get metadata from providers, sort and fill gaps by priority, and save a gamevault entry
    for (const provider of this.providers) {
      const metadata = provider.search(game);
    }
    throw new NotImplementedException("Method not implemented.");
  }

  findMetadata(game: GamevaultGame, providerSlug: string) {
    return this.getProviderBySlugOrFail(providerSlug).search(game);
  }

  refreshMetadata(game: GamevaultGame, providerSlug?: string) {
    // TODO: for each gamemetadata, refresh it using the provider
    throw new NotImplementedException("Method not implemented.");
  }

  unmapMetadata(game: GamevaultGame, providerSlug?: string) {
    // TODO: clear effective metadata and remove each metadata from the game except user
    throw new NotImplementedException("Method not implemented.");
  }

  remapMetadata(
    game: GamevaultGame,
    providerSlug: string,
    newProviderId: string,
  ) {
    // TODO: Remove relation of current metadata and create a new one
    throw new NotImplementedException("Method not implemented.");
  }

  private getBestMatchingGameMetadata(
    game: GamevaultGame,
    metadata: GameMetadata[],
  ) {
    // TODO: get the best matching metadata
    throw new NotImplementedException("Method not implemented.");
  }
}
