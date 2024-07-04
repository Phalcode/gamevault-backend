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

import { GamesService } from "../games/games.service";
import { GamevaultGame } from "../games/gamevault-game.entity";
import { GameMetadataType } from "./games/game-metadata-type.enum";
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
      await this.checkGame(game);
    }
  }

  /**
   * Checks the metadata of a single game and updates it if necessary.
   */
  private async checkGame(game: GamevaultGame): Promise<void> {
    for (const provider of this.providers) {
      await this.checkProvider(game, provider);
    }
    await this.merge(game);
  }

  /**
   * Checks the metadata of a single provider and updates it if necessary.
   */
  private async checkProvider(
    game: GamevaultGame,
    provider: MetadataProvider,
  ): Promise<void> {
    try {
      const existingProviderMetadata = game.provider_metadata?.find(
        (m) => m.provider_slug === provider.slug,
      );

      if (existingProviderMetadata) {
        await this.checkExistingMetadata(
          game,
          provider,
          existingProviderMetadata,
        );
      } else {
        await this.checkMissingMetadata(game, provider);
      }
    } catch (error) {
      this.logger.error({
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
  private async checkExistingMetadata(
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
  private async checkMissingMetadata(
    game: GamevaultGame,
    provider: MetadataProvider,
  ): Promise<void> {
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

  async merge(game: GamevaultGame): Promise<GamevaultGame> {
    //TODO: FIX ERRORS MERGING DATA
    // Get existing Metadata and sort them by provider-slug in provider priority in ascending order
    game.provider_metadata.sort((a, b) => {
      const aProvider = this.getProviderBySlugOrFail(a.provider_slug);
      const bProvider = this.getProviderBySlugOrFail(b.provider_slug);
      return aProvider.priority - bProvider.priority;
    });

    let mergedMetadata = new GameMetadata();

    // Create New Effective Metadata by applying the priorotized metadata one by one
    for (const metadata of game.provider_metadata) {
      mergedMetadata = { ...mergedMetadata, ...metadata } as GameMetadata;
    }

    // Apply the users changes on top
    if (game.user_metadata) {
      mergedMetadata = {
        ...mergedMetadata,
        ...game.user_metadata,
        ...{
          type: GameMetadataType.MERGED,
          id: game.metadata.id,
          created_at: game.metadata.created_at,
          updated_at: game.metadata.updated_at,
          entity_version: game.metadata.entity_version,
        },
      } as GameMetadata;
    }

    // Save the new effective metadata
    game.metadata = mergedMetadata;
    this.logger.debug({
      message: "Merged metadata",
      game,
    });

    return await this.gamesService.save(game);
  }

  /**
   * Removes metadata from the game. Does not remove user provided metadata.

   */
  async unmap(gameId: number, providerSlug?: string) {
    // Find the game by gameId.
    const game = await this.gamesService.findOneByGameIdOrFail(gameId, {
      loadDeletedEntities: false,
      loadRelations: true,
    });

    // Clear the effective metadata.
    game.metadata = null;

    // If a providerSlug is provided, remove the metadata of the specified provider.
    // Otherwise, remove all metadata.
    game.provider_metadata = providerSlug
      ? game.provider_metadata.filter(
          (metadata) => metadata.provider_slug !== providerSlug,
        )
      : [];
    return this.merge(game);
  }

  /**
   * Maps the metadata of a game provider to a game, overwriting the existing one if necessary.
   */
  async map(
    gameId: number,
    providerSlug: string,
    targetProviderDataId: string,
  ) {
    // Find the game by gameId.
    const game = await this.gamesService.findOneByGameIdOrFail(gameId, {
      loadDeletedEntities: true,
      loadRelations: true,
    });

    // Remove the metadata of the specified provider.
    game.provider_metadata = game.provider_metadata.filter(
      (metadata) => metadata.provider_slug !== providerSlug,
    );

    // Get the fresh metadata from the target provider.
    const freshMetadata =
      await this.getProviderBySlugOrFail(
        providerSlug,
      ).getByProviderDataIdOrFail(targetProviderDataId);

    // Upsert the fresh metadata into the database.
    const updatedMetadata =
      await this.gameMetadataService.upsert(freshMetadata);

    // Push the updated metadata into the game's provider_metadata array.
    game.provider_metadata.push(updatedMetadata);
    return this.merge(game);
  }
}
