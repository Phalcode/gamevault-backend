import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
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
} from "typeorm";

import { DatabaseEntity } from "../database/database.entity";
import { GameMetadata } from "../metadata/games/game.metadata.entity";
import { Progress } from "../progresses/progress.entity";
import { GamevaultUser } from "../users/gamevault-user.entity";
import { GameType } from "./models/game-type.enum";

@Entity()
export class GamevaultGame extends DatabaseEntity {
  @Index({ unique: true })
  @Column({ unique: true })
  @ApiProperty({
    description:
      "file path to the game or the game manifest (relative to root)",
    example: "/files/Action/Grand Theft Auto V (v1.0.0).zip",
  })
  path: string;

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
    description: "title of the game (extracted from the filename')",
    example: "Grand Theft Auto V",
  })
  title?: string;

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
      "release date of the game (extracted from filename e.g. '(2013)')",
    example: "2013-01-01T00:00:00.000Z",
  })
  release_date?: Date;

  @Column({ default: false })
  @ApiProperty({
    description:
      "indicates if the game is an early access title (extracted from filename e.g. '(EA)')",
    example: true,
    default: false,
  })
  early_access: boolean = false;

  @Column({ default: 0 })
  @ApiProperty({
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
  @ApiProperty({
    description:
      "type of the game, see https://gamevau.lt/docs/server-docs/game-types for all possible values",
    type: "enum",
    enum: GameType,
    example: GameType.WINDOWS_PORTABLE,
  })
  type: GameType;

  @JoinTable()
  @ManyToMany(() => GameMetadata, (metadata) => metadata.gamevault_games)
  @ApiPropertyOptional({
    description: "metadata of various providers associated to the game",
    type: () => GameMetadata,
    isArray: true,
  })
  provider_metadata: GameMetadata[];

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
  user_metadata?: GameMetadata;

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
  metadata?: GameMetadata;

  @OneToMany(() => Progress, (progress) => progress.game)
  @ApiPropertyOptional({
    description: "progresses associated to the game",
    type: () => Progress,
    isArray: true,
  })
  progresses?: Progress[];

  @ManyToMany(() => GamevaultUser, (user) => user.bookmarked_games)
  @ApiProperty({
    description: "users that bookmarked this game",
    type: () => GamevaultGame,
    isArray: true,
  })
  bookmarked_users?: GamevaultUser[];

  public getLoggableData() {
    return {
      id: this.id,
      path: this.path,
    };
  }

  @AfterLoad()
  async nullChecks() {
    if (!this.provider_metadata) {
      this.provider_metadata = [];
    }
  }
}
