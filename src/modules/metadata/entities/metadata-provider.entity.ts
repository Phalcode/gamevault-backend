import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Matches } from "class-validator";
import { Column, Entity, Index, JoinTable, OneToMany } from "typeorm";

import { DatabaseEntity } from "../../database/database.entity";
import { DeveloperMetadata } from "./data/developer-metadata.entity";
import { GameMetadata } from "./data/game-metadata.entity";
import { GenreMetadata } from "./data/genre-metadata.entity";
import { PublisherMetadata } from "./data/publisher-metadata.entity";
import { StoreMetadata } from "./data/store-metadata.entity";
import { TagMetadata } from "./data/tag-metadata.entity";

@Entity()
export class MetadataProvider extends DatabaseEntity {
  @Column({ unique: true })
  @Index()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      "Invalid slug: Only lowercase letters, numbers, and single hyphens inbetween them are allowed.",
  })
  @ApiProperty({
    description: "slug of the provider. Must be formatted like a valid slug.",
    examples: [
      "my-custom-metadata-provider",
      "igdb",
      "steam",
      "epic-games",
      "rawg-2-steam",
    ],
  })
  slug: string;

  @OneToMany(() => GameMetadata, (game) => game.metadata_provider)
  @ApiProperty({
    description: "games developed by the developer",
    type: () => GameMetadata,
    isArray: true,
  })
  games: GameMetadata[];

  @JoinTable()
  @OneToMany(
    () => PublisherMetadata,
    (publisher) => publisher.metadata_provider,
  )
  @ApiPropertyOptional({
    description: "publishers of the game",
    type: () => PublisherMetadata,
    isArray: true,
  })
  publishers: PublisherMetadata[];

  @JoinTable()
  @OneToMany(
    () => DeveloperMetadata,
    (developer) => developer.metadata_provider,
  )
  @ApiPropertyOptional({
    description: "developers of the game",
    type: () => DeveloperMetadata,
    isArray: true,
  })
  developers: DeveloperMetadata[];

  @JoinTable()
  @OneToMany(() => StoreMetadata, (store) => store.metadata_provider)
  @ApiPropertyOptional({
    description: "stores of the game",
    type: () => StoreMetadata,
    isArray: true,
  })
  stores: StoreMetadata[];

  @JoinTable()
  @OneToMany(() => TagMetadata, (tag) => tag.metadata_provider)
  @ApiPropertyOptional({
    description: "tags of the game",
    type: () => TagMetadata,
    isArray: true,
  })
  tags: TagMetadata[];

  @JoinTable()
  @OneToMany(() => GenreMetadata, (genre) => genre.metadata_provider)
  @ApiPropertyOptional({
    description: "genres of the game",
    type: () => GenreMetadata,
    isArray: true,
  })
  genres: GenreMetadata[];
}
