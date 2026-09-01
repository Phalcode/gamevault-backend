import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  AfterLoad,
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  Relation,
} from "typeorm";

import { DatabaseEntity } from "../database/database.entity.js";
import { GameMetadata } from "../metadata/games/game.metadata.entity.js";
import { Progress } from "../progresses/progress.entity.js";
import { GamevaultUser } from "../users/gamevault-user.entity.js";
import { GameVersion } from "./game-version.entity.js";
import { GameType } from "./models/game-type.enum.js";
import { sortGameVersions } from "./version-selection.util.js";

@Entity()
export class GamevaultGame extends DatabaseEntity {
  @Index({ unique: true })
  @Column({ unique: true })
  @ApiPropertyOptional({
    description:
      "file path to the game or the game manifest (relative to root)",
    deprecated: true,
    example: "/files/Action/Grand Theft Auto V (v1.0.0).zip",
  })
  file_path?: string;

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
  @ApiPropertyOptional({
    description:
      "legacy mirror of selected version size in bytes (use versions[])",
    deprecated: true,
    example: "1234567890",
    type: () => String,
  })
  size?: bigint;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    description: "title of the game (extracted from the filename')",
    example: "Grand Theft Auto V",
  })
  title?: string;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    description:
      "sort title of the game, generated and used to optimize sorting.",
    example: "grand theft auto 5",
  })
  sort_title?: string;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    description: "version tag (extracted from the filename e.g. '(v1.0.0)')",
    deprecated: true,
    example: "v1.0.0",
  })
  version?: string;

  @OneToMany(() => GameVersion, (version) => version.game, {
    eager: true,
  })
  @ApiPropertyOptional({
    description: "all indexed versions for this game",
    type: () => GameVersion,
    isArray: true,
  })
  versions?: Relation<GameVersion[]>;

  @Index()
  @Column({ nullable: true })
  @ApiPropertyOptional({
    description:
      "legacy mirror of selected version release date (use versions[])",
    deprecated: true,
    example: "2013-01-01T00:00:00.000Z",
  })
  release_date?: Date;

  @Column({ default: false })
  @ApiPropertyOptional({
    description:
      "legacy mirror of selected version early-access flag (use versions[])",
    deprecated: true,
    example: true,
    default: false,
  })
  early_access?: boolean = false;

  @Column({ default: 0 })
  @ApiPropertyOptional({
    description:
      "Indicates how many times the game has been downloaded on this server.",
    example: 10,
    default: 0,
  })
  download_count: number = 0;

  @Column({
    type: "simple-enum",
    enum: GameType,
    default: GameType.UNDETECTABLE,
  })
  @ApiPropertyOptional({
    description: "legacy mirror of selected version type (use versions[])",
    deprecated: true,
    type: "string",
    enum: GameType,
    example: GameType.WINDOWS_PORTABLE,
  })
  type: GameType;

  @JoinTable({
    name: "gamevault_game_provider_metadata_game_metadata",
    joinColumn: {
      name: "gamevault_game_id",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "game_metadata_id",
      referencedColumnName: "id",
    },
  })
  @ManyToMany(() => GameMetadata)
  @ApiPropertyOptional({
    description: "metadata of various providers associated to the game",
    type: () => GameMetadata,
    isArray: true,
  })
  provider_metadata?: Relation<GameMetadata[]>;

  @OneToOne(() => GameMetadata, {
    nullable: true,
    cascade: true,
    onDelete: "SET NULL",
    orphanedRowAction: "delete",
  })
  @JoinColumn()
  @ApiPropertyOptional({
    description: "user-defined metadata of the game",
    type: () => GameMetadata,
  })
  user_metadata?: Relation<GameMetadata>;

  @OneToOne(() => GameMetadata, {
    eager: true,
    nullable: true,
    cascade: true,
    onDelete: "SET NULL",
    orphanedRowAction: "delete",
  })
  @JoinColumn()
  @ApiPropertyOptional({
    description: "effective and merged metadata of the game",
    type: () => GameMetadata,
  })
  metadata?: Relation<GameMetadata>;

  @OneToMany(() => Progress, (progress) => progress.game)
  @ApiPropertyOptional({
    description: "progresses associated to the game",
    type: () => Progress,
    isArray: true,
  })
  progresses?: Relation<Progress[]>;

  @ManyToMany(() => GamevaultUser, (user) => user.bookmarked_games)
  @ApiPropertyOptional({
    description: "users that bookmarked this game",
    type: () => GamevaultUser,
    isArray: true,
  })
  bookmarked_users?: Relation<GamevaultUser[]>;

  private createSortTitle(title: string): string {
    // List of leading articles to be removed
    const articles: string[] = ["the", "a", "an"];

    // Convert the title to lowercase
    let sortTitle: string = title.toLowerCase().trim();

    // Remove any leading article
    for (const article of articles) {
      const articleWithSpace = article + " ";
      if (sortTitle.startsWith(articleWithSpace)) {
        sortTitle = sortTitle.substring(articleWithSpace.length);
        break;
      }
    }

    // Remove special characters except alphanumeric and spaces
    sortTitle = sortTitle.replace(/[^a-z0-9\s]/g, "");

    // Replace multiple spaces with a single space and trim
    sortTitle = sortTitle.replace(/\s+/g, " ").trim();

    return sortTitle;
  }

  @AfterLoad()
  async nullChecks() {
    if (!this.provider_metadata) {
      this.provider_metadata = [];
    }

    if (!this.versions) {
      this.versions = [];
    }

    this.versions = sortGameVersions(this.versions);
  }
}
