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

import configuration from "../../configuration";
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
   * Checks the metadata of games and updates them if necessary.
   */
  async check(games: GamevaultGame[]): Promise<void> {
    for (const game of games) {
      try {
        await this.updateMetadata(game);
      } catch (error) {
        this.logger.warn({
          message: "Error checking metadata for game.",
          game: game.getLoggableData(),
          error,
        });
      }
    }
  }

  private async updateMetadata(game: GamevaultGame): Promise<GamevaultGame> {
    if (
      game.metadata &&
      game.metadata?.created_at >
        new Date(
          Date.now() - configuration.METADATA.TTL_IN_DAYS * 24 * 60 * 60 * 1000,
        )
    ) {
      this.logger.debug({
        message: "Metadata is up to date.",
        game: game.getLoggableData(),
      });
      return;
    }

    this.logger.log({
      message: "Updating metadata.",
      game: game.getLoggableData(),
    });

    for (const provider of this.providers) {
      try {
        const existingProviderMetadata = game.provider_metadata.find(
          (metadata) => metadata.provider_slug === provider.slug,
        );

        if (existingProviderMetadata) {
          await this.map(
            game.id,
            provider.slug,
            existingProviderMetadata.provider_data_id,
          );
        } else {
          await this.findMetadata(game, provider);
        }
      } catch (error) {
        this.logger.warn({
          message: "Failed updating metadata for game and provider. Skipping.",
          game: game.getLoggableData(),
          provider: provider.getLoggableData(),
          error,
        });
      }
    }
    return this.merge(game.id);
  }

  /**
   * Checks the metadata of a single provider and updates it if necessary.
   */
  private async findMetadata(
    game: GamevaultGame,
    provider: MetadataProvider,
  ): Promise<void> {
    this.logger.log({
      message: "Searching for metadata.",
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
    const results = this.getProviderBySlugOrFail(providerSlug).search(game);
    this.logger.debug({
      message: "Searched for metadata.",
      provider: providerSlug,
      game: game.getLoggableData(),
      results,
    });
    return results;
  }

  async merge(gameId: number): Promise<GamevaultGame> {
    const game = await this.gamesService.findOneByGameIdOrFail(gameId, {
      loadDeletedEntities: false,
      loadRelations: true,
    });

    if (!game.provider_metadata.length && !game.user_metadata) {
      this.logger.warn({
        message: "No metadata found to merge.",
        game: gameId,
      });
      return game;
    }

    const providerMetadata = game.provider_metadata.toSorted((a, b) => {
      const aProvider = this.getProviderBySlugOrFail(a.provider_slug);
      const bProvider = this.getProviderBySlugOrFail(b.provider_slug);
      return aProvider.priority - bProvider.priority;
    });

    const userMetadata = game.user_metadata;

    let mergedMetadata = new GameMetadata();

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
        id: game.metadata?.id || undefined,
        provider_slug: "gamevault",
        provider_data_id: gameId.toString(),
        provider_checksum: null,
        provider_probability: null,
        //gamevault_games: [game],
      },
    } as GameMetadata;

    // Save the merged metadata
    game.metadata = mergedMetadata;
    const mergedGame = await this.gamesService.save(game);
    this.logger.debug({
      message: "Merged metadata.",
      game: mergedGame.getLoggableData(),
      details: mergedGame,
    });
    return mergedGame;
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
    game.provider_metadata = game.provider_metadata.filter(
      (metadata) => metadata.provider_slug !== providerSlug,
    );
    this.logger.log({
      message: "Unmapped metadata provider from a game.",
      game: game.getLoggableData(),
      providerSlug,
    });

    if (game.metadata) {
      // Clear the merged metadata.
      await this.gameMetadataService.deleteByGameMetadataIdOrFail(
        game.metadata.id,
      );
      game.metadata = null;
      this.logger.debug({
        message: "Deleted merged metadata for a game.",
        game: game.getLoggableData(),
        providerSlug,
      });
    }

    // Clear the user metadata if necessary.
    if (providerSlug === "user") {
      await this.gameMetadataService.deleteByGameMetadataIdOrFail(
        game.user_metadata.id,
      );
      game.user_metadata = null;
      this.logger.log({
        message: "Deleted user metadata from a game.",
        game: game.getLoggableData(),
        providerSlug,
      });
    }

    return this.gamesService.save(game);
  }

  /**
   * Maps the metadata of a game provider to a game, overwriting the existing one if necessary.
   * Metadata usually needs to be merged after to be effective.
   */
  async map(gameId: number, providerSlug: string, providerGameId: string) {
    const provider = this.getProviderBySlugOrFail(providerSlug);
    const metadata = await provider.getByProviderDataIdOrFail(providerGameId);
    const game = await this.unmap(gameId, providerSlug);
    game.provider_metadata.push(await this.gameMetadataService.save(metadata));
    const mappedGame = await this.gamesService.save(game);
    this.logger.log({
      message: "Mapped metadata provider to a game.",
      game: mappedGame.getLoggableData(),
      providerSlug,
    });
    return mappedGame;
  }
}
