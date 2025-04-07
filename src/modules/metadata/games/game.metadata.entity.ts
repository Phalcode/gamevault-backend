import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotIn, Matches } from "class-validator";
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
} from "typeorm";

import globals from "../../../globals";
import { MediaValidator } from "../../../validators/media.validator";
import { DatabaseEntity } from "../../database/database.entity";
import { Media } from "../../media/media.entity";
import { DeveloperMetadata } from "../developers/developer.metadata.entity";
import { GenreMetadata } from "../genres/genre.metadata.entity";
import { Metadata } from "../models/metadata.interface";
import { PublisherMetadata } from "../publishers/publisher.metadata.entity";
import { TagMetadata } from "../tags/tag.metadata.entity";

@Entity()
@Index("UQ_GAME_METADATA", ["provider_slug", "provider_data_id"], {
  unique: true,
})
export class GameMetadata extends DatabaseEntity implements Metadata {
  //#region Provider Metadata Properties
  @Column({ nullable: true })
  @Index()
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
    example: "igdb",
  })
  provider_slug?: string;

  @Column({ nullable: true })
  @Index()
  @ApiPropertyOptional({
    description: "id of the game from the provider",
    example: "Grand Theft Auto V",
  })
  provider_data_id?: string;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    description: "url of the game from the provider",
    example: "https://www.igdb.com/games/grand-theft-auto-v",
    pattern: "url",
  })
  provider_data_url?: string;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    description: "optional priority override for this metadata",
    example: 1,
  })
  provider_priority?: number;

  //#endregion

  @Column({ type: "int", nullable: true })
  @ApiPropertyOptional({
    description: "the minimum age required to play the game",
    example: 18,
    default: 0,
  })
  age_rating?: number;

  @Column({ nullable: true })
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
    description: "description of the game. markdown supported.",
    example:
      "An open world action-adventure video game developed by **Rockstar North** and published by **Rockstar Games**.",
  })
  description?: string;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    description:
      "public notes from the admin for the game. markdown supported.",
    example: "# README \n Install other game first!",
  })
  notes?: string;

  @Column({ type: "int", nullable: true })
  @ApiPropertyOptional({
    description: "average playtime of other people in the game in minutes",
    example: 180,
  })
  average_playtime?: number;

  @MediaValidator("image")
  @ManyToOne(() => Media, {
    nullable: true,
    eager: true,
  })
  @JoinColumn()
  @ApiPropertyOptional({
    description: "cover/boxart image of the game",
    type: () => Media,
  })
  cover?: Media;

  @MediaValidator("image")
  @ManyToOne(() => Media, {
    nullable: true,
    eager: true,
  })
  @JoinColumn()
  @ApiPropertyOptional({
    description: "background image of the game",
    type: () => Media,
  })
  background?: Media;

  @Column({ type: "simple-array", nullable: true })
  @ApiPropertyOptional({
    description: "URLs of externally hosted screenshots of the game",
    isArray: true,
  })
  url_screenshots?: string[];

  @Column({ type: "simple-array", nullable: true })
  @ApiPropertyOptional({
    description: "URLs of externally hosted trailer videos of the game",
    isArray: true,
  })
  url_trailers?: string[];

  @Column({ type: "simple-array", nullable: true })
  @ApiPropertyOptional({
    description: "URLs of externally hosted gameplay videos of the game",
    isArray: true,
  })
  url_gameplays?: string[];

  @Column({ type: "simple-array", nullable: true })
  @ApiPropertyOptional({
    description: "URLs of websites of the game",
    example: "https://escapefromtarkov.com",
    isArray: true,
  })
  url_websites?: string[];

  @Column({ type: "float", nullable: true })
  @ApiPropertyOptional({
    description: "rating of the provider",
    example: 90,
  })
  rating?: number;

  @Column({ nullable: true })
  @ApiProperty({
    description: "indicates if the game is in early access",
    example: true,
  })
  early_access?: boolean;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    description: "Predefined launch parameters for the game.",
    example: "-fullscreen -dx11",
  })
  launch_parameters?: string;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    description: "Predefined launch executable for the game.",
    example: "ShooterGame.exe",
  })
  launch_executable?: string;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    description: "Predefined installer executable for the game.",
    example: "setup.exe",
  })
  installer_executable?: string;

  @JoinTable({
    name: "game_metadata_publishers_publisher_metadata",
    joinColumn: {
      name: "game_metadata_id",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "publisher_metadata_id",
      referencedColumnName: "id",
    },
  })
  @ManyToMany(() => PublisherMetadata, (publisher) => publisher.games, {
    eager: true,
  })
  @ApiPropertyOptional({
    description: "publishers of the game",
    type: () => PublisherMetadata,
    isArray: true,
  })
  publishers?: PublisherMetadata[];

  @JoinTable({
    name: "game_metadata_developers_developer_metadata",
    joinColumn: {
      name: "game_metadata_id",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "developer_metadata_id",
      referencedColumnName: "id",
    },
  })
  @ManyToMany(() => DeveloperMetadata, (developer) => developer.games, {
    eager: true,
  })
  @ApiPropertyOptional({
    description: "developers of the game",
    type: () => DeveloperMetadata,
    isArray: true,
  })
  developers?: DeveloperMetadata[];

  @JoinTable({
    name: "game_metadata_tags_tag_metadata",
    joinColumn: {
      name: "game_metadata_id",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "tag_metadata_id",
      referencedColumnName: "id",
    },
  })
  @ManyToMany(() => TagMetadata, (tag) => tag.games, {
    eager: true,
  })
  @ApiPropertyOptional({
    description: "tags of the game",
    type: () => TagMetadata,
    isArray: true,
  })
  tags?: TagMetadata[];

  @JoinTable({
    name: "game_metadata_genres_genre_metadata",
    joinColumn: {
      name: "game_metadata_id",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "genre_metadata_id",
      referencedColumnName: "id",
    },
  })
  @ManyToMany(() => GenreMetadata, (genre) => genre.games, {
    eager: true,
  })
  @ApiPropertyOptional({
    description: "genres of the game",
    type: () => GenreMetadata,
    isArray: true,
  })
  genres?: GenreMetadata[];
}
