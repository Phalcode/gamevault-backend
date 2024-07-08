import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { validateOrReject } from "class-validator";

import globals from "../../globals";
import { GamesService } from "../games/games.service";
import { GamevaultGame } from "../games/gamevault-game.entity";
import { GameMetadata } from "./games/game.metadata.entity";
import { GameMetadataService } from "./games/game.metadata.service";
import { MinimalGameMetadataDto } from "./games/minimal-game.metadata.dto";
import { MetadataProvider } from "./providers/abstract.metadata-provider.service";

@Injectable()
export class MetadataService {
  private readonly logger = new Logger(this.constructor.name);
  providers: MetadataProvider[] = [];

  constructor(
    @Inject(forwardRef(() => GamesService))
    private gamesService: GamesService,
    private gameMetadataService: GameMetadataService,
  ) {}

  /**
   * Registers a metadata provider.
   * If a provider with the same slug or priority already exists, throws a ConflictException.
   * Validates the provider using class-validator and throws an InternalServerErrorException if validation fails.
   * Sorts the providers by priority in ascending order.
   */
  registerProvider(provider: MetadataProvider) {
    // Check if a provider with the same slug or priority already exists
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

    // Validate the provider using class-validator
    validateOrReject(provider).catch((errors) => {
      throw new InternalServerErrorException(errors);
    });

    // Add the provider to the list of providers
    this.providers.push(provider);

    // Sort the providers by priority in ascending order
    this.providers.sort((a, b) => a.priority - b.priority);

    // Log the registration of the metadata provider
    this.logger.log({
      message: `Registered metadata provider.`,
      slug: provider.slug,
      priority: provider.priority,
    });
  }

  /**
   * Retrieves a metadata provider by its slug.
   * If no provider is found, it throws a NotFoundException.
   */
  getProviderBySlugOrFail(slug: string): MetadataProvider {
    if (!slug) {
      throw new NotFoundException(`No slug provided.`);
    }

    // Find the provider with the given slug.
    const provider = this.providers.find((provider) => provider.slug === slug);

    // If no provider is found, throw a NotFoundException.
    if (!provider) {
      throw new NotFoundException(
        `There is no registered provider with slug "${slug}".`,
      );
    }

    // Return the found provider.
    return provider;
  }

  /**
   * Checks the metadata of each game and updates it if necessary.
   */
  async check(games: GamevaultGame[]): Promise<void> {
    for (const game of games) {
      for (const provider of this.providers) {
        await this.checkGameByProvider(game, provider);
      }
    }
  }

  /**
   * Checks the metadata of a single provider and updates it if necessary.
   */
  private async checkGameByProvider(
    game: GamevaultGame,
    provider: MetadataProvider,
  ): Promise<void> {
    try {
      const existingProviderMetadata = game.metadata?.find(
        (m) => m.provider_slug === provider.slug,
      );

      if (existingProviderMetadata) {
        await this.updateExistingMetadata(
          game,
          provider,
          existingProviderMetadata,
        );
      } else {
        await this.findMissingMetadata(game, provider);
      }
    } catch (error) {
      this.logger.warn({
        message: "Failed to check metadata for game.",
        provider: provider.getLoggableData(),
        game: game.getLoggableData(),
        error,
      });
    }
  }

  /**
   * Checks the metadata of a single provider and updates it if necessary.
   */
  private async updateExistingMetadata(
    game: GamevaultGame,
    provider: MetadataProvider,
    existingProviderMetadata: GameMetadata,
  ): Promise<void> {
    if (!provider.ttlDays) {
      this.logger.debug({
        message:
          "Not updating existing metadata, as this provider has a time-to-live value of 0.",
        provider: provider.getLoggableData(),
        game: game.getLoggableData(),
      });
      return;
    }

    const ttlMilliseconds = provider.ttlDays * 24 * 60 * 60 * 1000;
    const outdated =
      existingProviderMetadata.updated_at <
      new Date(Date.now() - ttlMilliseconds);

    if (outdated) {
      this.logger.log({
        message: "Updating outdated metadata.",
        provider: provider.getLoggableData(),
        game: game.getLoggableData(),
      });
      await this.map(
        game.id,
        provider.slug,
        existingProviderMetadata.provider_data_id,
      );
    }
  }

  /**
   * Checks the metadata of a single provider and updates it if necessary.
   */
  private async findMissingMetadata(
    game: GamevaultGame,
    provider: MetadataProvider,
  ): Promise<void> {
    this.logger.log({
      message: "Searching for missing metadata.",
      provider: provider.getLoggableData(),
      game: game.getLoggableData(),
    });
    const bestMatchingGame = await provider.getBestMatch(game);
    await this.map(game.id, provider.slug, bestMatchingGame.provider_data_id);
  }

  /**
   * Searches for metadata of a game using a specific provider.
   */
  async search(
    game: GamevaultGame,
    providerSlug: string,
  ): Promise<MinimalGameMetadataDto[]> {
    return this.getProviderBySlugOrFail(providerSlug).search(game);
  }

  async merge(gameId: number): Promise<GamevaultGame> {
    const relatedMetadata = await this.gameMetadataService.findByGameId(gameId);

    if (!relatedMetadata.length) {
      this.logger.warn({
        message: "No metadata found to merge.",
        game: gameId,
      });
      return this.gamesService.findOneByGameIdOrFail(gameId, {
        loadDeletedEntities: false,
        loadRelations: false,
      });
    }

    const providerMetadata = relatedMetadata
      .filter(
        (metadata) =>
          !globals.RESERVED_PROVIDER_SLUGS.includes(metadata.provider_slug),
      )
      .sort((a, b) => {
        const aProvider = this.getProviderBySlugOrFail(a.provider_slug);
        const bProvider = this.getProviderBySlugOrFail(b.provider_slug);
        return aProvider.priority - bProvider.priority;
      });

    const userMetadata = relatedMetadata.find(
      (metadata) => metadata.provider_slug === "user",
    );

    const existingMergedMetadata = relatedMetadata.find(
      (metadata) => metadata.provider_slug === "gamevault",
    );

    let mergedMetadata = { ...existingMergedMetadata } as GameMetadata;

    // Create New Effective Metadata by applying the priorotized metadata one by one
    for (const metadata of providerMetadata) {
      mergedMetadata = {
        ...mergedMetadata,
        ...metadata,
      } as GameMetadata;
    }

    // Apply the users changes on top
    if (userMetadata) {
      mergedMetadata = {
        ...mergedMetadata,
        ...userMetadata,
      } as GameMetadata;
    }

    // Apply the merged metadata to the game
    mergedMetadata = {
      ...mergedMetadata,
      ...{
        id: existingMergedMetadata?.id || undefined,
        provider_slug: "gamevault",
        provider_data_id: gameId.toString(),
        provider_checksum: null,
        provider_probability: null,
        gamevault_games: [
          await this.gamesService.findOneByGameIdOrFail(gameId, {
            loadDeletedEntities: false,
            loadRelations: false,
          }),
        ],
      },
    } as GameMetadata;

    await this.gameMetadataService.save(mergedMetadata);
    return this.gamesService.findOneByGameIdOrFail(gameId, {
      loadDeletedEntities: false,
      loadRelations: true,
    });
  }

  /**
   * Removes metadata from the game. Does not remove user provided metadata.

   */
  async unmap(gameId: number, providerSlug: string) {
    // Find the game by gameId.
    const game = await this.gamesService.findOneByGameIdOrFail(gameId, {
      loadDeletedEntities: false,
      loadRelations: true,
    });

    // Clear the effective metadata.
    game.metadata = game.metadata.filter(
      (metadata) => metadata.provider_slug !== providerSlug,
    );

    await this.gamesService.save(game);
    return this.merge(game.id);
  }

  /**
   * Maps the metadata of a game provider to a game, overwriting the existing one if necessary.
   */
  async map(
    gameId: number,
    providerSlug: string,
    targetProviderDataId: string,
  ) {
    const provider = this.getProviderBySlugOrFail(providerSlug);
    const metadata =
      await provider.getByProviderDataIdOrFail(targetProviderDataId);
    const game = await this.unmap(gameId, providerSlug);
    game.metadata.push(await this.gameMetadataService.save(metadata));
    await this.gamesService.save(game);
    return this.merge(game.id);
  }
}
