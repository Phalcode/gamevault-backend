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

import { compareTwoStrings } from "string-similarity";
import { GamevaultGame } from "../../games/game.entity";
import { DeveloperMetadata } from "../developers/developer.metadata.entity";
import { DeveloperMetadataService } from "../developers/developer.metadata.service";
import { GameMetadata } from "../games/game.metadata.entity";
import { GameMetadataService } from "../games/game.metadata.service";
import { GenreMetadata } from "../genres/genre.metadata.entity";
import { GenreMetadataService } from "../genres/genre.metadata.service";
import { MetadataService } from "../metadata.service";
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
  ) {}

  async onModuleInit() {
    await this.register();
  }

  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      "Invalid slug: Only lowercase letters, numbers, and single hyphens inbetween them are allowed.",
  })
  @IsNotIn(["gamevault", "user"], {
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

  public abstract search(game: GamevaultGame): Promise<GameMetadata[]>;

  public abstract update(game: GameMetadata): Promise<GameMetadata>;

  public async getBestMatch(game: GamevaultGame): Promise<GameMetadata> {
    const gameResults = await this.search(game);

    if (gameResults.length === 0) {
      throw new NotFoundException("No matching games found.");
    }

    for (const gameResult of gameResults) {
      const cleanedGameTitle = game.title
        ?.toLowerCase()
        .replace(/[^\w\s]/g, "");
      const cleanedGameResultTitle = gameResult.title
        ?.toLowerCase()
        .replace(/[^\w\s]/g, "");

      gameResult.provider_probability = compareTwoStrings(
        cleanedGameTitle,
        cleanedGameResultTitle,
      );

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

    gameResults.sort(
      (a, b) =>
        b.provider_probability - a.provider_probability,
    );

    return gameResults[0];
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

  public async findPublishers(): Promise<GameMetadata[]> {
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
}
