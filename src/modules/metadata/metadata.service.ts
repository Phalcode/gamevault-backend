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

import { kebabCase } from "lodash";
import { setTimeout } from "timers/promises";
import configuration from "../../configuration";
import { logGamevaultGame, logMetadataProvider } from "../../logging";
import { GamesService } from "../games/games.service";
import { GamevaultGame } from "../games/gamevault-game.entity";
import { GameType } from "../games/models/game-type.enum";
import { GameMetadata } from "./games/game.metadata.entity";
import { GameMetadataService } from "./games/game.metadata.service";
import { MinimalGameMetadataDto } from "./games/minimal-game.metadata.dto";
import { MetadataProvider } from "./providers/abstract.metadata-provider.service";
import { ProviderNotFoundException } from "./providers/models/provider-not-found.exception";

@Injectable()
export class MetadataService {
  private readonly logger = new Logger(this.constructor.name);
  private readonly metadataJobs = new Map<number, GamevaultGame>();
  private isProcessingQueue = false;
  providers: MetadataProvider[] = [];

  constructor(
    @Inject(forwardRef(() => GamesService))
    private readonly gamesService: GamesService,
    private readonly gameMetadataService: GameMetadataService,
  ) {}

  /**
   * Registers a metadata provider.
   * If a provider with the same slug or priority already exists, throws a ConflictException.
   * Validates the provider using class-validator and throws an InternalServerErrorException if validation fails.
   * Sorts the providers by priority in ascending order.
   */
  registerProvider(provider: MetadataProvider) {
    // Check if a provider with the same slug or priority already exists
    const existingProvider = this.providers?.find(
      (existingProvider) =>
        existingProvider.slug === provider.slug ||
        existingProvider.priority === provider.priority,
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
      this.logger.error({
        message: `Failed to register metadata provider due to validation errors.`,
        provider: logMetadataProvider(provider),
      });
      console.error(errors);
    });

    // Add the provider to the list of providers
    this.providers.push(provider);

    // Sort the providers by priority in descending order
    this.providers.sort((a, b) => b.priority - a.priority);

    // Log the registration of the metadata provider
    this.logger.log({
      message: `Registered metadata provider.`,
      provider: logMetadataProvider(provider),
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
      throw new ProviderNotFoundException(
        `There is no registered provider with slug "${slug}".`,
      );
    }

    // Return the found provider.
    return provider;
  }

  /**
   * Checks the metadata of games and updates them if necessary.
   */
  async addUpdateMetadataJob(game: GamevaultGame): Promise<void> {
    if (this.metadataJobs.has(game.id)) {
      this.logger.debug({
        message: "Skipping metadata job as it is already enqueued.",
        game: logGamevaultGame(game),
      });
      return;
    }

    this.metadataJobs.set(game.id, game);
    this.processQueue();
  }

  /**
   * Processes the queue sequentially
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.metadataJobs.size > 0) {
      const [gameId, game] = this.metadataJobs.entries().next().value;

      try {
        await this.updateMetadata(game);
      } catch (error) {
        this.logger.warn({
          message: "Error updating metadata for game.",
          game: logGamevaultGame(game),
          error,
        });
      } finally {
        this.metadataJobs.delete(gameId);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Updates the metadata of a game if necessary.
   * If the game's file path contains "(NC)", the metadata update is skipped.
   * If the game's metadata is already up to date (i.e. the TTL has not been exceeded),
   * the metadata update is skipped.
   * If the metadata update fails for a provider, the error is logged and the update is skipped.
   * @param game The game to update the metadata for.
   * @returns The updated game.
   */
  private async updateMetadata(game: GamevaultGame): Promise<void> {
    if (!game) {
      this.logger.error({
        message: "Corresponding metadata-job was not found",
        game: { id: game.id },
      });
      throw new NotFoundException("Corresponding metadata-job was not found");
    }

    this.logger.log({
      message: "Updating metadata.",
      game: logGamevaultGame(game),
    });

    // If the game's file path contains "(NC)", skip the metadata update.
    if (game.file_path.includes("(NC)")) {
      this.logger.debug({
        message: "Skipping metadata update for (NC) game.",
        game: logGamevaultGame(game),
      });
      return;
    }

    for (const provider of this.providers.filter(
      (provider) => provider.enabled,
    )) {
      try {
        // Find the existing provider metadata for the game and provider.
        const existingProviderMetadata = game.provider_metadata?.find(
          (metadata) => metadata.provider_slug === provider.slug,
        );

        // If the existing provider metadata is already up to date, skip the update.
        if (
          existingProviderMetadata &&
          (existingProviderMetadata.updated_at ??
            existingProviderMetadata.created_at) >
            new Date(
              Date.now() -
                configuration.METADATA.TTL_IN_DAYS * 24 * 60 * 60 * 1000,
            )
        ) {
          this.logger.debug({
            message: "Metadata is already up to date. Skipping.",
            game: logGamevaultGame(game),
            provider: logMetadataProvider(provider),
          });
          continue;
        }

        if (provider.request_interval_ms) {
          // Waiting the specified request interval to prevent hitting rate limits before making requests to the provider
          this.logger.debug({
            message: `Delaying requests by ${provider.request_interval_ms} ms to avoid rate limits.`,
            game: logGamevaultGame(game),
            provider: logMetadataProvider(provider),
          });
          await setTimeout(provider.request_interval_ms);
        }

        // If the existing provider metadata is not up to date, update it.
        if (existingProviderMetadata) {
          await this.map(
            game.id,
            provider.slug,
            existingProviderMetadata.provider_data_id,
          );
        } else {
          // If the existing provider metadata is not found, find the metadata.
          await this.findMetadata(game, provider);
        }

        // Merge the metadata.
        this.merge(game.id);
      } catch (error) {
        // If the metadata update fails, log the error and skip the update.
        this.logger.error({
          message: "Failed updating metadata for game and provider. Skipping.",
          game: logGamevaultGame(game),
          provider: logMetadataProvider(provider),
          error,
        });
      }
    }

    // If no metadata changes were made, return the game without merging the metadata.
    if (
      !game.metadata ||
      game.provider_metadata.some(
        (provider_metadata) =>
          provider_metadata?.updated_at > game.metadata?.updated_at,
      ) ||
      game.user_metadata?.updated_at > game.metadata?.updated_at
    ) {
      this.merge(game.id).catch((error) => {
        this.logger.warn({
          message: "Error merging metadata for game.",
          game: logGamevaultGame(game),
          error,
        });
      });
    } else {
      this.logger.debug({
        message: "No metadata changes. Skipping merge.",
        game: logGamevaultGame(game),
      });
    }
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
      game: logGamevaultGame(game),
      provider: logMetadataProvider(provider),
    });
    try {
      const bestMatchingGame = await provider.getBestMatch(game);
      await this.map(game.id, provider.slug, bestMatchingGame.provider_data_id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.debug({
          message: "No matching game found.",
          game: logGamevaultGame(game),
          provider: logMetadataProvider(provider),
        });
        return;
      }
      throw error;
    }
  }

  /**
   * Searches for metadata of a game using a specific provider.
   */
  async search(
    query: string,
    providerSlug: string,
  ): Promise<MinimalGameMetadataDto[]> {
    const provider = this.getProviderBySlugOrFail(providerSlug);
    try {
      const results = provider.search(query);
      this.logger.debug({
        message: "Searched for metadata.",
        provider: logMetadataProvider(provider),
        query,
        results,
      });
      return results;
    } catch (error) {
      this.logger.error({
        message: "Error searching provider.",
        provider: logMetadataProvider(provider),
        query,
        error,
      });
      throw new InternalServerErrorException(
        error,
        "Error searching provider. Please check the server logs for details.",
      );
    }
  }

  async merge(gameId: number): Promise<GamevaultGame> {
    const game = await this.gamesService.findOneByGameIdOrFail(gameId, {
      loadDeletedEntities: false,
      loadRelations: ["metadata", "provider_metadata", "user_metadata"],
    });

    if (!game.provider_metadata.length && !game.user_metadata) {
      this.logger.warn({
        message: "No metadata found to merge.",
        game: gameId,
        provider_metadata: game.provider_metadata,
        user_metadata: game.user_metadata,
      });
      return game;
    }

    // Sort the provider metadata by priority in ascending order
    const providerMetadata = game.provider_metadata.toSorted((a, b) => {
      return (
        (a.provider_priority ??
          this.getProviderBySlugOrFail(a.provider_slug).priority) -
        (b.provider_priority ??
          this.getProviderBySlugOrFail(b.provider_slug).priority)
      );
    });

    const userMetadata = JSON.parse(
      JSON.stringify(game.user_metadata),
    ) as GameMetadata;

    let mergedMetadata = new GameMetadata();

    // Set fallback data
    mergedMetadata.release_date = game.release_date;
    if (game.type === GameType.WINDOWS_SETUP) {
      mergedMetadata.installer_parameters =
        '/D="%INSTALLDIR%" /S /DIR="%INSTALLDIR%" /SILENT /COMPONENTS=text';
    }

    // Create New Effective Metadata by applying the priorotized metadata one by one
    for (const metadata of providerMetadata) {
      // Delete all empty fields of provider so only delta is overwritten
      for (const key of Object.keys(metadata)) {
        if (metadata[key] == null) {
          delete metadata[key];
        }
        if (Array.isArray(metadata[key]) && metadata[key].length === 0) {
          delete metadata[key];
        }
      }

      mergedMetadata = {
        ...mergedMetadata,
        ...metadata,
      } as GameMetadata;
    }

    // Apply file metadata on top (EA)
    mergedMetadata.early_access = game.early_access;

    // Apply the users changes on top
    if (userMetadata) {
      // Delete all empty fields of dto.user_metadata so only delta is overwritten
      for (const key of Object.keys(userMetadata)) {
        if (userMetadata[key] == null) {
          delete userMetadata[key];
        }
        if (
          Array.isArray(userMetadata[key]) &&
          userMetadata[key].length === 0
        ) {
          delete userMetadata[key];
        }
      }

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
        provider_priority: null,
      },
    } as GameMetadata;

    if (mergedMetadata.genres?.length) {
      for (const genre of mergedMetadata.genres) {
        genre.id = undefined;
        genre.provider_slug = "gamevault";
        genre.provider_data_id = kebabCase(genre.name);
      }
    }

    if (mergedMetadata.tags?.length) {
      for (const tag of mergedMetadata.tags) {
        tag.id = undefined;
        tag.provider_slug = "gamevault";
        tag.provider_data_id = kebabCase(tag.name);
      }
    }

    if (mergedMetadata.developers?.length) {
      for (const developer of mergedMetadata.developers) {
        developer.id = undefined;
        developer.provider_slug = "gamevault";
        developer.provider_data_id = kebabCase(developer.name);
      }
    }

    if (mergedMetadata.publishers?.length) {
      for (const publisher of mergedMetadata.publishers) {
        publisher.id = undefined;
        publisher.provider_slug = "gamevault";
        publisher.provider_data_id = kebabCase(publisher.name);
      }
    }

    // Save the merged metadata
    game.metadata = await this.gameMetadataService.save(mergedMetadata);
    const mergedGame = await this.gamesService.save(game);
    this.logger.debug({
      message: "Merged metadata.",
      game: logGamevaultGame(mergedGame),
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
    });

    // Clear the effective metadata.
    game.provider_metadata = game.provider_metadata.filter(
      (metadata) => metadata.provider_slug !== providerSlug,
    );
    this.logger.log({
      message: "Unmapped metadata provider from a game.",
      game: logGamevaultGame(game),
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
        game: logGamevaultGame(game),
        providerSlug,
      });
    }

    // Clear the user metadata if necessary.
    if (providerSlug === "user" && game.user_metadata?.id) {
      await this.gameMetadataService.deleteByGameMetadataIdOrFail(
        game.user_metadata.id,
      );
      game.user_metadata = null;
      game.sort_title = this.gamesService.generateSortTitle(game.title);
      this.logger.log({
        message: "Deleted user metadata from a game.",
        game: logGamevaultGame(game),
        providerSlug,
      });
    }

    return this.gamesService.save(game);
  }

  /**
   * Maps a game to a metadata provider by fetching and saving the metadata.
   *
   * @param gameId - The ID of the game to map metadata to
   * @param providerSlug - The slug of the metadata provider (e.g., 'igdb', 'rawg')
   * @param providerGameId - The unique identifier of the game in the provider's system
   * @param providerPriorityOverride - Optional priority override for the metadata provider
   */
  async map(
    gameId: number,
    providerSlug: string,
    providerGameId: string,
    providerPriorityOverride?: number,
  ): Promise<GamevaultGame> {
    const provider = this.getProviderBySlugOrFail(providerSlug);

    try {
      // Fetch metadata from provider
      const fetchedMetadata =
        await provider.getByProviderDataIdOrFail(providerGameId);

      // Apply priority override if provided
      if (providerPriorityOverride != null) {
        fetchedMetadata.provider_priority = providerPriorityOverride;
      }

      // Save the metadata
      const gameMetadata = await this.gameMetadataService.save(fetchedMetadata);

      // Unmap the game from older metadata
      await this.unmap(gameId, providerSlug);

      // Get the game and update its metadata
      const game = await this.gamesService.findOneByGameIdOrFail(gameId, {
        loadDeletedEntities: false,
        loadRelations: ["provider_metadata"],
      });

      // Only add the metadata if it's not already associated with the game
      if (!game.provider_metadata.some((m) => m.id === gameMetadata.id)) {
        this.logger.debug({
          message: "Adding new metadata provider mapping to game",
          game: logGamevaultGame(game),
          provider_metadata: game.provider_metadata,
          new_provider_metadata: gameMetadata,
        });
        game.provider_metadata.push(gameMetadata);
        await this.gamesService.save(game);
      }

      // Log successful mapping
      this.logger.log({
        message: "Successfully mapped metadata provider to game",
        game: logGamevaultGame(game),
        providerSlug,
      });

      return game;
    } catch (error) {
      // Log the error with detailed context
      this.logger.error({
        message: "Failed to map game to metadata provider",
        provider: logMetadataProvider(provider),
        game: logGamevaultGame({ id: gameId } as GamevaultGame),
        error,
      });

      // Re-throw with appropriate error message
      throw new InternalServerErrorException(
        error,
        "Failed to map game to metadata provider. Please check the server logs for details.",
      );
    }
  }
}
