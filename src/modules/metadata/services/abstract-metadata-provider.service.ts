import { Injectable } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import {
  IsInt,
  IsNotEmpty,
  IsNotIn,
  IsPositive,
  Matches,
} from "class-validator";

import { GamevaultGame } from "../../games/game.entity";
import { DeveloperMetadata } from "../entities/developer-metadata.entity";
import { GameMetadata } from "../entities/game-metadata.entity";
import { GenreMetadata } from "../entities/genre-metadata.entity";
import { StoreMetadata } from "../entities/store-metadata.entity";
import { TagMetadata } from "../entities/tag-metadata.entity";
import { DeveloperMetadataService } from "./developers-metadata.service";
import { GameMetadataService } from "./game-metadata.service";
import { GenreMetadataService } from "./genre-metadata.service";
import { PublisherMetadataService } from "./publisher-metadata.service";
import { StoreMetadataService } from "./store-metadata.service";
import { TagMetadataService } from "./tag-metadata.service";

@Injectable()
export abstract class MetadataProvider {
  constructor(
    slug: string,
    priority: number,
    private gameMetadataService: GameMetadataService,
    private developerMetadataService: DeveloperMetadataService,
    private publisherMetadataService: PublisherMetadataService,
    private tagMetadataService: TagMetadataService,
    private genreMetadataService: GenreMetadataService,
    private storeMetadataService: StoreMetadataService,
  ) {
    this.slug = slug;
    this.priority = priority;
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
    description:
      "priority of usage for this provider. Lower priority providers are tried first, while higher priority providers fill in gaps. Must be a number.",
  })
  public priority: number;

  public abstract search(game: GamevaultGame): Promise<GameMetadata[]>;

  public abstract update(game: GameMetadata): Promise<GameMetadata>;

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

  public async findStores(): Promise<StoreMetadata[]> {
    return this.storeMetadataService.find(this.slug);
  }
}
