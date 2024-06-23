import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  NotImplementedException,
} from "@nestjs/common";
import { validateOrReject } from "class-validator";

import { GamesService } from "../games/games.service";
import { GamevaultGame } from "../games/gamevault-game.entity";
import { GameMetadata } from "./games/game.metadata.entity";
import { GameMetadataService } from "./games/game.metadata.service";
import { MetadataProvider } from "./providers/abstract.metadata-provider.service";

@Injectable()
export class MetadataService {
  private readonly logger = new Logger(this.constructor.name);
  providers: MetadataProvider[] = [];

  constructor(private gamesService: GamesService, private gameMetadataService: GameMetadataService) {}

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
        // Find existing metadata for the provider.
        const existingProviderMetadata = game.metadata.find(
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
            await this.updateMetadata(game.id);
          } else {
            // Log that the metadata is up to date.
            this.logger.debug({
              message: "Metadata is up to date.",
              provider: provider.getLoggableData(),
              game: game.getLoggableData(),
            });
          }
        } else {
          try {
            // If the metadata does not exist, get the best match for the game from the provider.
            const metadata = await this.getProviderBySlugOrFail(
              provider.slug,
            ).getBestMatch(game);

            // Save the metadata to the database.
            await this.gameMetadataService.upsert(metadata);

            // Add the metadata to the game's metadata array.
            game.metadata.push(metadata);
          } catch (error) {
            this.logger.warn({
              message: "Failed to get best matching metadata from provider.",
              provider: provider.getLoggableData(),
              game: game.getLoggableData(),
              error,
            });
          }
        }
      }
      // Save the game to the database.
      await this.gamesService.save(game);

      // Merge metadata
      await this.mergeMetadata(game.id);
    }
  }
  /**
   * Searches for metadata of a game using a specific provider.
   *
   * @param {GamevaultGame} game - The game object to search metadata for.
   * @param {string} providerSlug - The slug of the provider to use for the search.
   * @return {Promise<GameMetadata[]>} A promise that resolves to an array of game metadata.
   */
  async searchMetadata(
    game: GamevaultGame,
    providerSlug: string,
  ): Promise<GameMetadata[]> {
    return this.getProviderBySlugOrFail(providerSlug).search(game);
  }

  /**
   * Updates the metadata of a game by fetching the latest information from
   * the provider and updating the game's metadata.
   *
   * @param {number} gameId - The ID of the game to update the metadata for.
   * @return {Promise<void>} A promise that resolves when the metadata is updated.
   */
  async updateMetadata(gameId: number): Promise<void> {
    // Find the game by ID.
    const game = await this.gamesService.findOneByGameIdOrFail(gameId);

    // Iterate over each metadata entry in the game's metadata array.
    for (const metadata of game.metadata) {
      try {
        // Get the provider object for the metadata.
        const provider = this.getProviderBySlugOrFail(metadata.provider_slug);

        // If the provider_data_id is missing, throw an exception.
        if (!metadata.provider_data_id) {
          throw new NotFoundException("Missing provider_data_id.");
        }

        // Get the latest metadata from the provider.
        const updatedMetadata = await provider.getByProviderDataId(
          metadata.provider_data_id,
        );

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
    await this.mergeMetadata(gameId);
  }

  async mergeMetadata(gameId: number) {
    const game = this.gamesService.findOneByGameIdOrFail(gameId);
    // sort and fill gaps by priority, and save a gamevault entry
    throw new NotImplementedException("Method not implemented.");
  }

  async unmapMetadata(gameId: number, providerSlug?: string) {
    // TODO: clear effective metadata and remove each metadata from the game except user

    throw new NotImplementedException("Method not implemented.");
  }

  async remapMetadata(
    gameId: number,
    providerSlug: string,
    newProviderId: string,
  ) {
    // TODO: Remove relation of current metadata and create a new one
    throw new NotImplementedException("Method not implemented.");
  }
}
