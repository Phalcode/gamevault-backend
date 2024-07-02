import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNotIn,
  IsPositive,
  Matches,
  Min,
} from "class-validator";
import { stringSimilarity } from "string-similarity-js";

import globals from "../../../globals";
import { GamevaultGame } from "../../games/gamevault-game.entity";
import { MediaService } from "../../media/media.service";
import { DeveloperMetadata } from "../developers/developer.metadata.entity";
import { DeveloperMetadataService } from "../developers/developer.metadata.service";
import { GameMetadata } from "../games/game.metadata.entity";
import { GameMetadataService } from "../games/game.metadata.service";
import { GenreMetadata } from "../genres/genre.metadata.entity";
import { GenreMetadataService } from "../genres/genre.metadata.service";
import { MetadataService } from "../metadata.service";
import { PublisherMetadata } from "../publishers/publisher.metadata.entity";
import { PublisherMetadataService } from "../publishers/publisher.metadata.service";
import { TagMetadata } from "../tags/tag.metadata.entity";
import { TagMetadataService } from "../tags/tag.metadata.service";

@Injectable()
export abstract class MetadataProvider implements OnModuleInit {
  protected readonly logger = new Logger(this.constructor.name);
  constructor(
    private metadataService: MetadataService,
    private gameMetadataService: GameMetadataService,
    private developerMetadataService: DeveloperMetadataService,
    private publisherMetadataService: PublisherMetadataService,
    private tagMetadataService: TagMetadataService,
    private genreMetadataService: GenreMetadataService,
    protected mediaService: MediaService,
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
  @ApiProperty({
    description:
      "slug (url-friendly name) of the provider. This is the primary identifier. Must be formatted like a valid slug.",
    examples: [
      "my-custom-metadata-provider",
      "igdb",
      "steam",
      "epic-games",
      "rawg-2-steam",
    ],
  })
  public slug: string;

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  @ApiProperty({
    type: Number,
    description:
      "priority of usage for this provider. Lower priority providers are tried first, while higher priority providers fill in gaps.",
  })
  public priority: number;

  @IsBoolean()
  @ApiProperty({
    type: Boolean,
    description: "whether this provider is enabled or not.",
    default: true,
  })
  public enabled = true;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  @ApiProperty({
    minimum: 0,
    type: Number,
    description:
      "the number of days (0 for never) to cache game metadata before updating it.",
    default: 30,
  })
  public ttlDays = 30;

  /**
   * Searches for a game using the provider.
   */
  public abstract search(game: GamevaultGame): Promise<GameMetadata[]>;

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
   * @returns A promise that resolves to the best match GameMetadata.
   * @throws NotFoundException if no matching games are found.
   */
  public async getBestMatch(game: GamevaultGame): Promise<GameMetadata> {
    // Search for the game using all available metadata providers.
    const gameResults = await this.search(game);

    // If no matching games are found, throw an exception.
    if (gameResults.length === 0) {
      throw new NotFoundException("No matching games found.");
    }

    // Calculate the probability of a game result being a match for the input game.
    for (const gameResult of gameResults) {
      // Remove non-alphanumeric characters and convert both titles to lowercase.
      const cleanedGameTitle = game.title
        ?.toLowerCase()
        .replace(/[^\w\s]/g, "");
      const cleanedGameResultTitle = gameResult.title
        ?.toLowerCase()
        .replace(/[^\w\s]/g, "");

      if (!cleanedGameTitle || !cleanedGameResultTitle) {
        this.logger.warn({
          message: "Could not clean game title.",
          game: game.getLoggableData(),
          gameResult: gameResult.getLoggableData(),
        });
        continue;
      }

      // Calculate the similarity between the two titles and assign it to the game result.
      gameResult.provider_probability = stringSimilarity(
        cleanedGameTitle,
        cleanedGameResultTitle,
      );

      // If both games have a release date, subtract the absolute difference in years divided by 10 from the match probability.
      if (game.release_date && gameResult.release_date) {
        const gameReleaseYear = new Date(
          gameResult.release_date,
        ).getUTCFullYear();
        const gameResultReleaseYear = new Date(
          gameResult.release_date,
        ).getUTCFullYear();
        gameResult.provider_probability -=
          Math.abs(gameResultReleaseYear - gameReleaseYear) / 10;
      }
    }

    // Sort the game results by the match probability in descending order.
    gameResults.sort((a, b) => b.provider_probability - a.provider_probability);

    // Return the game result with the highest match probability.
    return gameResults.pop();
  }

  public async register() {
    if (!this.enabled) {
      this.logger.warn({
        message: `Metadata provider "${this.slug}" is disabled.`,
      });
      return;
    }
    this.metadataService.registerProvider(this);
  }

  public async findGames(): Promise<GameMetadata[]> {
    return this.gameMetadataService.find(this.slug);
  }

  public async findPublishers(): Promise<PublisherMetadata[]> {
    return this.publisherMetadataService.find(this.slug);
  }

  public async findDevelopers(): Promise<DeveloperMetadata[]> {
    return this.developerMetadataService.find(this.slug);
  }

  public async findTags(): Promise<TagMetadata[]> {
    return this.tagMetadataService.find(this.slug);
  }

  public async findGenres(): Promise<GenreMetadata[]> {
    return this.genreMetadataService.find(this.slug);
  }

  public getLoggableData() {
    return {
      slug: this.slug,
      priority: this.priority,
      enabled: this.enabled,
      ttlDays: this.ttlDays,
    };
  }
}
