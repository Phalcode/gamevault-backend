import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
} from "typeorm";
import { GameType } from "../../games/models/game-type.enum";
import { DatabaseEntityV12 } from "./database.v12-entity";
import { DeveloperV12 } from "./developer.v12-entity";
import { GamevaultUserV12 } from "./gamevault-user.v12-entity";
import { GenreV12 } from "./genre.v12-entity";
import { ImageV12 } from "./image.v12-entity";
import { ProgressV12 } from "./progress.v12-entity";
import { PublisherV12 } from "./publisher.v12-entity";
import { StoreV12 } from "./store.v12-entity";
import { TagV12 } from "./tag.v12-entity";

@Entity("v12_game")
export class GameV12 extends DatabaseEntityV12 {
  @Column({ nullable: true })
  @ApiPropertyOptional({
    description: "unique rawg-api-identifier of the game",
    example: 1212,
  })
  rawg_id?: number;

  @Column()
  @Index()
  @ApiProperty({
    description: "title of the game (extracted from the filename)",
    example: "Grand Theft Auto V",
  })
  title: string;

  @Column()
  @Column({ nullable: true })
  @ApiPropertyOptional({
    description:
      "rawg-api-title of the game (a correction needed if different from title)",
    example: "Grand Theft Auto V",
  })
  rawg_title?: string;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    description: "version tag (extracted from the filename e.g. '(v1.0.0)')",
    example: "v1.0.0",
  })
  version?: string;

  @Index()
  @Column({ nullable: true })
  @ApiPropertyOptional({
    description:
      "release date of the game (ideally extracted from the filename; if unavailable, it may be obtained from RAWG).",
    example: "2013-09-17T00:00:00.000Z",
  })
  release_date?: Date;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    description: "release date of the game (from rawg-api)",
    example: "2013-09-17T00:00:00.000Z",
  })
  rawg_release_date?: Date;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    description: "date the game was last updated using the rawg-api",
    example: "2021-03-01T00:00:00.000Z",
  })
  cache_date?: Date;

  @Index({ unique: true })
  @Column({ unique: true })
  @ApiProperty({
    description: "filepath to the game (relative to the root)",
    example: "Grand Theft Auto V (v1.0.0).zip",
  })
  file_path: string;

  @Column({
    type: "bigint",
    default: 0,
    transformer: {
      to: (value) => value,
      from: (value) => {
        if (value) return BigInt(value).toString();
        return value;
      },
    },
  })
  @ApiProperty({
    description: "size of the game file in bytes",
    example: "1234567890",
    type: () => String,
  })
  size: bigint;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    description: "rawg-api description of the game",
    example:
      "An open world action-adventure video game developed by Rockstar North and published by Rockstar Games.",
  })
  description?: string;

  @OneToOne(() => ImageV12, {
    nullable: true,
    eager: true,
    onDelete: "CASCADE",
    orphanedRowAction: "soft-delete",
  })
  @JoinColumn()
  @ApiPropertyOptional({
    description: "box image of the game",
    type: () => ImageV12,
  })
  box_image?: ImageV12;

  @OneToOne(() => ImageV12, {
    nullable: true,
    eager: true,
    onDelete: "CASCADE",
    orphanedRowAction: "soft-delete",
  })
  @JoinColumn()
  @ApiPropertyOptional({
    description: "background image of the game",
    type: () => ImageV12,
  })
  background_image?: ImageV12;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    description: "website url of the game from rawg-api",
    example: "https://www.escapefromtarkov.com/",
  })
  website_url?: string;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    description: "metacritic rating from rawg-api of the game",
    example: 90,
  })
  metacritic_rating?: number;

  @Column({ nullable: true, type: "integer" })
  @ApiPropertyOptional({
    description:
      "average playtime of other people in the game (similar to howlongtobeat.com) from rawg-api (in minutes)",
    example: 180,
  })
  average_playtime?: number;

  @Column()
  @ApiProperty({
    description:
      "indicates if the game is an early access title ('(EA)' Flag in the filename)",
    example: true,
  })
  early_access: boolean;

  @Column({
    type: "simple-enum",
    enum: GameType,
    default: GameType.UNDETECTABLE,
  })
  @ApiProperty({
    description: "type of the game",
    type: "enum",
    enum: GameType,
    example: GameType.WINDOWS_PORTABLE,
  })
  type: GameType;

  @OneToMany(() => ProgressV12, (progress) => progress.game)
  @ApiPropertyOptional({
    description: "progresses associated to the game",
    type: () => ProgressV12,
    isArray: true,
  })
  progresses?: ProgressV12[];

  @JoinTable({ name: "v12_game_publishers_v12_publisher" })
  @ManyToMany(() => PublisherV12, (publisher) => publisher.games)
  @ApiPropertyOptional({
    description: "publishers of the game",
    type: () => PublisherV12,
    isArray: true,
  })
  publishers?: PublisherV12[];

  @JoinTable({ name: "v12_game_developers_v12_developer" })
  @ManyToMany(() => DeveloperV12, (developer) => developer.games)
  @ApiPropertyOptional({
    description: "developers of the game",
    type: () => DeveloperV12,
    isArray: true,
  })
  developers?: DeveloperV12[];

  @JoinTable({ name: "v12_game_stores_v12_store" })
  @ManyToMany(() => StoreV12, (store) => store.games)
  @ApiPropertyOptional({
    description: "stores of the game",
    type: () => StoreV12,
    isArray: true,
  })
  stores?: StoreV12[];

  @JoinTable({ name: "v12_game_tags_v12_tag" })
  @ManyToMany(() => TagV12, (tag) => tag.games)
  @ApiPropertyOptional({
    description: "tags of the game",
    type: () => TagV12,
    isArray: true,
  })
  tags?: TagV12[];

  @JoinTable({ name: "v12_game_genres_v12_genre" })
  @ManyToMany(() => GenreV12, (genre) => genre.games)
  @ApiPropertyOptional({
    description: "genres of the game",
    type: () => GenreV12,
    isArray: true,
  })
  genres?: GenreV12[];

  @ManyToMany(() => GamevaultUserV12, (user) => user.bookmarked_games)
  @ApiProperty({
    description: "users that bookmarked this game",
    type: () => GameV12,
    isArray: true,
  })
  bookmarked_users?: GamevaultUserV12[];
}
