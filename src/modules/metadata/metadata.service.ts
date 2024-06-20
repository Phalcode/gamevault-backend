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
import { GamesService } from "../games/games.service";
import { MetadataProvider } from "./providers/abstract.metadata-provider.service";

@Injectable()
export class MetadataService {
  private readonly logger = new Logger(this.constructor.name);
  providers: MetadataProvider[] = [];

  constructor(private gamesService: GamesService) {}

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

  async check(games: GamevaultGame[]) {
    for (const game of games) {
      for (const provider of this.providers) {
        const existingProviderMetadata = game.metadata.find(
          (m) => m.provider_slug === provider.slug,
        );
        if (existingProviderMetadata) {
          if (!provider.ttlDays) {
            this.logger.debug({
              message:
                "Not updating existing metadata, as this provider has a time-to-live value of 0.",
              provider: {
                slug: provider.slug,
                priority: provider.priority,
                ttl: provider.ttlDays,
              },
              game: {
                id: game.id,
                path: game.path,
              },
            });
            continue;
          }
          //CHeck if existingProviderMetadata is up to date (older than ttl (days) of the provider)
          if (
            existingProviderMetadata.updated_at <
            new Date(Date.now() - provider.ttlDays * 24 * 60 * 60 * 1000)
          ) {
            this.logger.debug({
              message: "Metadata is outdated.",
              provider: {
                slug: provider.slug,
                priority: provider.priority,
                ttl: provider.ttlDays,
              },
              game: {
                id: game.id,
                path: game.path,
              },
              metadata: {
                id: existingProviderMetadata.id,
                updated_at: existingProviderMetadata.updated_at,
                provider: existingProviderMetadata.provider_slug,
                provider_id: existingProviderMetadata.provider_data_id,
                provider_checksum: existingProviderMetadata.provider_checksum,
              },
            });
            await this.updateMetadata(game.id);
          }
          this.logger.debug({
            message: "Metadata is up to date.",
            provider: {
              slug: provider.slug,
              priority: provider.priority,
              ttl: provider.ttlDays,
            },
            game: {
              id: game.id,
              path: game.path,
            },
          });
        }
      }
      throw new NotImplementedException("Method not implemented.");
    }
  }

  async searchMetadata(game: GamevaultGame, providerSlug: string) {
    return this.getProviderBySlugOrFail(providerSlug).search(game);
  }

  async updateMetadata(gameId: number) {
    const game = await this.gamesService.findOneByGameIdOrFail(gameId);
    for (let metadata of game.metadata) {
      metadata = await this.getProviderBySlugOrFail(
        metadata.provider_slug,
      ).update(metadata);
      // TODO: merge metadata
    }
  }

  mergeMetadata(gameId: number) {
    const game = this.gamesService.findOneByGameIdOrFail(gameId);
    // sort and fill gaps by priority, and save a gamevault entry
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
}
