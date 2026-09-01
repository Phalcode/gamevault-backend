import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
  Unique,
} from "typeorm";

import { DatabaseEntity } from "../database/database.entity.js";
import { GamevaultGame } from "./gamevault-game.entity.js";
import { GameType } from "./models/game-type.enum.js";

@Entity({ name: "game_version" })
@Unique("UQ_b0b88b548562b921436bdacea35", ["game", "file_path"])
export class GameVersion extends DatabaseEntity {
  @Index()
  @ManyToOne(() => GamevaultGame, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "game_id" })
  @ApiProperty({
    description: "game associated with this version",
    type: () => GamevaultGame,
  })
  game!: Relation<GamevaultGame>;

  @Column()
  @ApiProperty({
    description: "file path for this specific version",
    example: "/files/Action/Grand Theft Auto V (v1.0.0).zip",
  })
  file_path!: string;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    description: "version tag for this specific version",
    example: "v1.0.0",
  })
  version?: string;

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
    description: "size of this version in bytes",
    example: "1234567890",
    type: () => String,
  })
  size!: bigint;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    description: "release date extracted from file name",
    example: "2013-01-01T00:00:00.000Z",
  })
  release_date?: Date;

  @Column({ default: false })
  @ApiProperty({
    description: "whether this version is marked as early access",
    example: false,
  })
  early_access: boolean = false;

  @Column({
    type: "simple-enum",
    enum: GameType,
    default: GameType.UNDETECTABLE,
  })
  @ApiProperty({
    description: "detected type of this version",
    type: "string",
    enum: GameType,
    example: GameType.WINDOWS_PORTABLE,
  })
  type!: GameType;

  @Column({ default: new Date() })
  @ApiProperty({
    description: "timestamp when this version was indexed",
    example: "2026-02-15T12:00:00.000Z",
  })
  indexed_at!: Date;
}
