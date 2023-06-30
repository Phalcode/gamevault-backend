import { ApiProperty } from "@nestjs/swagger";
import { Entity, Column, ManyToOne } from "typeorm";
import { State } from "../../models/state.enum";
import { Game } from "./game.entity";
import { CrackpipeUser } from "./crackpipe-user.entity";
import { AbstractEntity } from "./abstract.entity";

@Entity()
export class Progress extends AbstractEntity {
  @ManyToOne(() => CrackpipeUser, (user) => user.progresses)
  @ApiProperty({
    description: "user the progress belongs to",
    type: () => CrackpipeUser,
  })
  user: CrackpipeUser;

  @ManyToOne(() => Game, (game) => game.progresses)
  @ApiProperty({
    description: "game the progress belongs to",
    type: () => Game,
  })
  game: Game;

  @Column({ default: 0 })
  @ApiProperty({
    description: "playtime in minutes",
    example: 25,
  })
  minutes_played: number;

  @Column({ type: "simple-enum", enum: State, default: State.UNPLAYED })
  @ApiProperty({
    description: "state of the game progress",
    type: "enum",
    enum: State,
    example: State.PLAYING,
  })
  state: State;

  @Column({ nullable: true })
  @ApiProperty({
    description: "date the progress was updated",
    example: "2020-01-01T00:00:00.000Z",
    required: false,
  })
  last_played_at?: Date;
}
