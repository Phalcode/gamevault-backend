import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Column, Entity, Index, ManyToOne, type Relation } from "typeorm";

import { DatabaseEntity } from "../database/database.entity.js";
import { GamevaultGame } from "../games/gamevault-game.entity.js";
import { GamevaultUser } from "../users/gamevault-user.entity.js";
import { State } from "./models/state.enum.js";

@Entity()
export class Progress extends DatabaseEntity {
  @Index()
  @ManyToOne(() => GamevaultUser, (user) => user.progresses)
  @ApiPropertyOptional({
    description: "user the progress belongs to",
    type: () => GamevaultUser,
  })
  user?: Relation<GamevaultUser>;

  @Index()
  @ManyToOne(() => GamevaultGame, (game) => game.progresses)
  @ApiPropertyOptional({
    description: "game the progress belongs to",
    type: () => GamevaultGame,
  })
  game?: Relation<GamevaultGame>;

  @Column({ type: "int", default: 0 })
  @ApiProperty({
    description: "playtime in minutes",
    example: 25,
  })
  minutes_played!: number;

  @Column({ type: "simple-enum", enum: State, default: State.UNPLAYED })
  @ApiProperty({
    description: "state of the game progress",
    type: "string",
    enum: State,
    example: State.PLAYING,
  })
  state!: State;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    description: "date the progress was updated",
    example: "2020-01-01T00:00:00.000Z",
  })
  last_played_at?: Date;
}
