import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
} from "typeorm";

import { DatabaseEntity } from "../../database/database.entity";
import { GamevaultGame } from "../../games/game.entity";
import { Media } from "../../media/media.entity";
import { DeveloperMetadata } from "./developer-metadata.entity";
import { GenreMetadata } from "./genre-metadata.entity";
import { PublisherMetadata } from "./publisher-metadata.entity";
import { StoreMetadata } from "./store-metadata.entity";
import { TagMetadata } from "./tag-metadata.entity";

@Entity()
export class GameMetadata extends DatabaseEntity {
  @Index()
  @ManyToMany(() => GamevaultGame, (game) => game.metadata)
  @ApiPropertyOptional({
    description: "games the metadata belongs to",
    type: () => GamevaultGame,
    isArray: true,
  })
  gamevault_games?: GamevaultGame[];

  @Column()
  @Index()
  @ApiProperty({
    description: "provider slug of the metadata",
  })
  metadata_provider: string;

  @Column()
  @Index()
  @ApiPropertyOptional({
    description: "id of the game from the provider",
    example: "Grand Theft Auto V",
  })
  metadata_provider_id?: string;

  @Column()
  @ApiPropertyOptional({
    description: "checksum of the provider data",
    example: "3608a6d1a05aba23ea390e5f3b48203dbb7241f7",
  })
  provider_checksum?: string;

  @Column({ nullable: true, type: "integer" })
  @ApiPropertyOptional({
    description: "the minimum age required to play the game",
    example: 18,
  })
  age_rating?: number;

  @Column()
  @Index()
  @ApiProperty({
    description: "title of the game",
    example: "Grand Theft Auto V",
  })
  title?: string;

  @Index()
  @Column({ nullable: true })
  @ApiPropertyOptional({
    description: "release date of the game",
    example: "2013-09-17T00:00:00.000Z",
  })
  release_date?: Date;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    description: "description of the game",
    example:
      "An open world action-adventure video game developed by Rockstar North and published by Rockstar Games.",
  })
  description?: string;

  @Column({ nullable: true, type: "integer" })
  @ApiPropertyOptional({
    description: "average playtime of other people in the game in minutes",
    example: 180,
  })
  average_playtime?: number;

  @OneToOne(() => Media, {
    nullable: true,
    eager: true,
    onDelete: "CASCADE",
    orphanedRowAction: "soft-delete",
  })
  @JoinColumn()
  @ApiPropertyOptional({
    description: "cover/boxart image of the game",
    type: () => Media,
  })
  cover?: Media;

  @OneToOne(() => Media, {
    nullable: true,
    eager: true,
    onDelete: "CASCADE",
    orphanedRowAction: "soft-delete",
  })
  @JoinColumn()
  @ApiPropertyOptional({
    description: "background image of the game",
    type: () => Media,
  })
  background?: Media;

  @ManyToOne(() => Media, {
    nullable: true,
    eager: true,
    onDelete: "CASCADE",
    orphanedRowAction: "soft-delete",
  })
  @JoinColumn()
  @ApiPropertyOptional({
    description: "screenshots of the game",
    type: () => Media,
    isArray: true,
  })
  screenshots?: Media[];

  @Column({ nullable: true })
  @ApiPropertyOptional({
    description: "website url of the game",
    example: "https://www.escapefromtarkov.com/",
  })
  url_website?: string;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    description: "rating of the provider",
    example: 90,
  })
  rating_provider?: number;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    description: "metacritic rating of the game",
    example: 90,
  })
  rating_metacritic?: number;

  @Column()
  @ApiProperty({
    description: "indicates if the game is in early access",
    example: true,
  })
  early_access?: boolean;

  @JoinTable()
  @ManyToMany(() => PublisherMetadata, (publisher) => publisher.games)
  @ApiPropertyOptional({
    description: "publishers of the game",
    type: () => PublisherMetadata,
    isArray: true,
  })
  publishers?: PublisherMetadata[];

  @JoinTable()
  @ManyToMany(() => DeveloperMetadata, (developer) => developer.games)
  @ApiPropertyOptional({
    description: "developers of the game",
    type: () => DeveloperMetadata,
    isArray: true,
  })
  developers?: DeveloperMetadata[];

  @JoinTable()
  @ManyToMany(() => StoreMetadata, (store) => store.games)
  @ApiPropertyOptional({
    description: "stores of the game",
    type: () => StoreMetadata,
    isArray: true,
  })
  stores?: StoreMetadata[];

  @JoinTable()
  @ManyToMany(() => TagMetadata, (tag) => tag.games)
  @ApiPropertyOptional({
    description: "tags of the game",
    type: () => TagMetadata,
    isArray: true,
  })
  tags?: TagMetadata[];

  @JoinTable()
  @ManyToMany(() => GenreMetadata, (genre) => genre.games)
  @ApiPropertyOptional({
    description: "genres of the game",
    type: () => GenreMetadata,
    isArray: true,
  })
  genres?: GenreMetadata[];
}
