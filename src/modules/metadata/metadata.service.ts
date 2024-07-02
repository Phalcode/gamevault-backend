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
   * @param {MetadataProvider} provider - The metadata provider to register.
   * @throws {ConflictException} If a provider with the same slug or priority already exists.
   * @throws {InternalServerErrorException} If validation of the provider fails.
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
   *
   * @param {string} slug - The slug of the provider.
   * @return {MetadataProvider} The metadata provider.
   * @throws {NotFoundException} If no provider is found.
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
   *
   * @param {GamevaultGame[]} games - The array of games to check.
   * @return {Promise<void>} A promise that resolves when the check is complete.
   */
  async check(games: GamevaultGame[]): Promise<void> {
    // Loop through each game.
    for (const game of games) {
      // Loop through each registered provider.
      for (const provider of this.providers) {
        try {
          // Find existing metadata for the provider.
          const existingProviderMetadata = game.provider_metadata?.find(
            (m) => m.provider_slug === provider.slug,
          );

          // If existing metadata exists.
          if (existingProviderMetadata) {
            // If the provider has a time-to-live (TTL) value of 0, log that the metadata is not updated and continue to the next provider.
            if (!provider.ttlDays) {
              this.logger.debug({
                message:
                  "Not updating existing metadata, as this provider has a time-to-live value of 0.",
                provider: provider.getLoggableData(),
                game: game.getLoggableData(),
              });
              continue;
            }

            // Calculate the TTL in milliseconds.
            const ttlMilliseconds = provider.ttlDays * 24 * 60 * 60 * 1000;

            // Check if the existing metadata is outdated.
            const outdated =
              existingProviderMetadata.updated_at <
              new Date(Date.now() - ttlMilliseconds);

            // If the existing metadata is outdated.
            if (outdated) {
              // Log that the metadata is outdated.
              this.logger.debug({
                message: "Metadata is outdated.",
                provider: provider.getLoggableData(),
                game: game.getLoggableData(),
                metadata: existingProviderMetadata.getLoggableData(),
              });

              // Update the metadata.
              await this.update(game.id);
            } else {
              // Log that the metadata is up to date.
              this.logger.debug({
                message: "Metadata is up to date.",
                provider: provider.getLoggableData(),
                game: game.getLoggableData(),
              });
            }
          } else {
            // AutoMetadataMatcher
            // If the metadata does not exist, get the best match for the game from the provider.

            // Search for the best match.
            const bestMatchingGame = await this.getProviderBySlugOrFail(
              provider.slug,
            ).getBestMatch(game);

            // Get the metadata from the provider.
            const freshMetadata = await provider.getByProviderDataIdOrFail(
              bestMatchingGame.provider_data_id,
            );

            // Save the metadata to the database.
            const upsertedMetadata =
              await this.gameMetadataService.upsert(freshMetadata);

            // Add the metadata to the game's metadata array.
            game.provider_metadata.push(upsertedMetadata);
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
      // Save the game to the database.
      await this.gamesService.save(game);

      // Merge metadata
      await this.merge(game.id);
    }
  }
  /**
   * Searches for metadata of a game using a specific provider.
   *
   * @param {GamevaultGame} game - The game object to search metadata for.
   * @param {string} providerSlug - The slug of the provider to use for the search.
   * @return {Promise<GameMetadata[]>} A promise that resolves to an array of game metadata.
   */
  async search(
    game: GamevaultGame,
    providerSlug: string,
  ): Promise<MinimalGameMetadataDto[]> {
    return this.getProviderBySlugOrFail(providerSlug).search(game);
  }

  /**
   * Updates the metadata of a game by fetching the latest information from
   * the provider and updating the game's metadata.
   *
   * @param {number} gameId - The ID of the game to update the metadata for.
   * @return {Promise<void>} A promise that resolves when the metadata is updated.
   */
  async update(gameId: number): Promise<void> {
    // Find the game by ID.
    const game = await this.gamesService.findOneByGameIdOrFail(gameId, {
      loadDeletedEntities: false,
      loadRelations: true,
    });

    // Iterate over each metadata entry in the game's metadata array.
    for (const metadata of game.provider_metadata) {
      try {
        // Get the provider object for the metadata.
        const provider = this.getProviderBySlugOrFail(metadata.provider_slug);

        // If the provider_data_id is missing, throw an exception.
        if (!metadata.provider_data_id) {
          throw new NotFoundException("Missing provider_data_id.");
        }

        // Get the latest metadata from the provider.
        const freshMetadata = await provider.getByProviderDataIdOrFail(
          metadata.provider_data_id,
        );
        const updatedMetadata =
          await this.gameMetadataService.upsert(freshMetadata);

        // Update the metadata object with the latest information.
        Object.assign(metadata, updatedMetadata);
      } catch (error) {
        // Log a warning if the metadata update failed.
        this.logger.warn({
          message: "Failed to update metadata from provider.",
          metadata: metadata.getLoggableData(),
          game: game.getLoggableData(),
          error,
        });
      }
    }

    // Save the updated game to the database.
    await this.gamesService.save(game);

    // Merge the metadata after updating it.
    await this.merge(gameId);
  }

  async merge(gameId: number) {
    const game = await this.gamesService.findOneByGameIdOrFail(gameId, {
      loadDeletedEntities: false,
      loadRelations: true,
    });

    // Clear effective metadata
    await this.gamesService.clearEffectiveMetadata(game.id);

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
        ...{ type: GameMetadataType.EFFECTIVE },
      } as GameMetadata;
    }

    // Save the new effective metadata
    game.metadata = mergedMetadata;
    this.logger.debug({
      message: "Merged metadata",
      game,
    });
    await this.gamesService.save(game);
  }

  /**
   * Removes metadata from the game. Does not remove user provided metadata.
   *
   * @param gameId - The ID of the game.
   * @param providerSlug - (Optional) The slug of the provider. If provided, only the metadata of the specified provider will be removed.
   * @returns A promise that resolves when the metadata is unmapped.
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
    if (providerSlug) {
      game.provider_metadata = game.provider_metadata.filter(
        (metadata) => metadata.provider_slug !== providerSlug,
      );
    } else {
      game.provider_metadata = [];
    }

    // Merge the metadata after unmapping it.
    return this.merge(gameId);
  }

  /**
   * Remaps the metadata of a game to another game on the same provider.
   *
   * @param gameId - The ID of the game.
   * @param providerSlug - The slug of the provider to use for the remapping.
   * @param targetProviderDataId - The target ID of the metadata in the provider.
   */
  async remap(
    gameId: number,
    providerSlug: string,
    targetProviderDataId: string,
  ) {
    // Find the game by gameId.
    const game = await this.gamesService.findOneByGameIdOrFail(gameId, {
      loadDeletedEntities: false,
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

    // Save the game with the updated provider_metadata.
    await this.gamesService.save(game);
  }
}
