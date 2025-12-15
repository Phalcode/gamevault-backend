import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNotIn,
  Matches,
  Min,
} from "class-validator";
import { stringSimilarity } from "string-similarity-js";

import { kebabCase } from "lodash";
import globals from "../../../globals";
import { logGamevaultGame } from "../../../logging";
import { GamevaultGame } from "../../games/gamevault-game.entity";
import { MediaService } from "../../media/media.service";
import { DeveloperMetadata } from "../developers/developer.metadata.entity";
import { DeveloperMetadataService } from "../developers/developer.metadata.service";
import { GameMetadata } from "../games/game.metadata.entity";
import { GameMetadataService } from "../games/game.metadata.service";
import { MinimalGameMetadataDto } from "../games/minimal-game.metadata.dto";
import { GenreMetadata } from "../genres/genre.metadata.entity";
import { GenreMetadataService } from "../genres/genre.metadata.service";
import { MetadataService } from "../metadata.service";
import { PublisherMetadata } from "../publishers/publisher.metadata.entity";
import { PublisherMetadataService } from "../publishers/publisher.metadata.service";
import { TagMetadata } from "../tags/tag.metadata.entity";
import { TagMetadataService } from "../tags/tag.metadata.service";
import { MetadataProviderDto } from "./models/metadata-provider.dto";

@Injectable()
export abstract class MetadataProvider
  implements OnModuleInit, MetadataProviderDto
{
  protected readonly logger = new Logger(this.constructor.name);
  constructor(
    protected readonly metadataService: MetadataService,
    private readonly gameMetadataService: GameMetadataService,
    private readonly developerMetadataService: DeveloperMetadataService,
    private readonly publisherMetadataService: PublisherMetadataService,
    private readonly tagMetadataService: TagMetadataService,
    private readonly genreMetadataService: GenreMetadataService,
    protected readonly mediaService: MediaService,
  ) {}

  async onModuleInit() {
    await this.register();
  }

  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      "Invalid slug: Only lowercase letters, numbers, and single hyphens inbetween them are allowed.",
  })
  @IsNotIn(globals.RESERVED_PROVIDER_SLUGS, {
    message:
      "Invalid slug: The terms 'gamevault' and 'user' are reserved slugs.",
  })
  public slug: string;

  @IsNotEmpty()
  public name: string;

  @IsInt()
  @IsNotEmpty()
  public priority: number;

  @IsBoolean()
  public enabled = true;

  @IsInt()
  @Min(0)
  public request_interval_ms = 0;

  public getDto(): MetadataProviderDto {
    return {
      slug: this.slug,
      name: this.name,
      priority: this.priority,
      enabled: this.enabled,
    };
  }

  /**
   * Searches for a game using the provider. Only returns the minimal info of a game.
   */
  public abstract search(query: string): Promise<MinimalGameMetadataDto[]>;

  /**
   * Returns a game metadata object using the id.
   *
   * **CAUTION: Data needs to be upserted before using it.**
   * @param provider_data_id - The provider data id of the game.
   * @returns A promise that resolves to the game metadata object.
   * @throws NotFoundException if the game is not found.
   */
  public abstract getByProviderDataIdOrFail(
    provider_data_id: string,
  ): Promise<GameMetadata>;

  /**
   * Searches for the best match for a given game using all available
   * metadata providers.
   *
   * @param game - The game to find a match for.
   * @returns A promise that resolves to the best match
   * @throws NotFoundException if no matching games are found.
   */
  public async getBestMatch(
    game: GamevaultGame,
  ): Promise<MinimalGameMetadataDto> {
    // Search for the game using all available metadata providers but remove Edition Tags in the search.
    const gameResults = await this.search(
      game.title
        .replace(/\[.*?\]/g, "")
        .replaceAll("  ", " ")
        .trim(),
    );

    // If no matching games are found, throw an exception.
    if (gameResults.length === 0) {
      throw new NotFoundException("No matching games found.");
    }

    // Map of game index (key) to probability (value).
    const probabilityMap = new Map<number, number>();

    // Calculate the probability of a game result being a match for the input game.
    for (const gameResult of gameResults) {
      // Clean casing
      const cleanedGameTitle = kebabCase(game.title);
      const cleanedGameResultTitle = kebabCase(gameResult.title);

      if (!cleanedGameTitle || !cleanedGameResultTitle) {
        this.logger.warn({
          message: "Could not clean game title.",
          game: logGamevaultGame(game),
          gameResult,
        });
        continue;
      }

      // Calculate the similarity between the two titles and assign it to the game result.
      probabilityMap.set(
        gameResults.indexOf(gameResult),
        stringSimilarity(cleanedGameTitle, cleanedGameResultTitle),
      );

      // If both games have a release date, subtract the absolute difference in years divided by 10 from the match probability.
      if (game.release_date && gameResult.release_date) {
        const gameReleaseYear = new Date(
          gameResult.release_date,
        ).getUTCFullYear();
        const gameResultReleaseYear = new Date(
          gameResult.release_date,
        ).getUTCFullYear();

        probabilityMap.set(
          gameResults.indexOf(gameResult),
          probabilityMap.get(gameResults.indexOf(gameResult)) -
            Math.abs(gameResultReleaseYear - gameReleaseYear) / 10,
        );
      }
    }

    // Sort the game results by the match probability in descending order.
    gameResults.sort(
      (a, b) =>
        probabilityMap.get(gameResults.indexOf(b)) -
        probabilityMap.get(gameResults.indexOf(a)),
    );

    this.logger.debug({
      message: "Found matching games.",
      game: logGamevaultGame(game),
      gameResults: gameResults.map((gameResult) => ({
        probability: probabilityMap.get(gameResults.indexOf(gameResult)),
        title: gameResult.title,
        release_date: gameResult.release_date,
        provider_data_id: gameResult.provider_data_id,
      })),
    });

    // Return the game result with the highest match probability.
    return gameResults.shift();
  }

  public async register() {
    if (!this.enabled) {
      this.logger.debug({
        message: `Metadata provider "${this.slug}" is disabled.`,
      });
      return;
    }
    this.metadataService.registerProvider(this);
  }

  public async findGames(): Promise<GameMetadata[]> {
    return this.gameMetadataService.findByProviderSlug(this.slug);
  }

  public async findPublishers(): Promise<PublisherMetadata[]> {
    return this.publisherMetadataService.findByProviderSlug(this.slug);
  }

  public async findDevelopers(): Promise<DeveloperMetadata[]> {
    return this.developerMetadataService.findByProviderSlug(this.slug);
  }

  public async findTags(): Promise<TagMetadata[]> {
    return this.tagMetadataService.findByProviderSlug(this.slug);
  }

  public async findGenres(): Promise<GenreMetadata[]> {
    return this.genreMetadataService.findByProviderSlug(this.slug);
  }
}
