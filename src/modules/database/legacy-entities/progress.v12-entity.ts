import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Column, Entity, Index, ManyToOne } from "typeorm";
import { State } from "../../progresses/models/state.enum";
import { DatabaseEntity } from "./database.v12-entity";
import { Game } from "./game.v12-entity";
import { GamevaultUser } from "./gamevault-user.v12-entity";

@Entity()
export class Progress extends DatabaseEntity {
  @Index()
  @ManyToOne(() => GamevaultUser, (user) => user.progresses)
  @ApiPropertyOptional({
    description: "user the progress belongs to",
    type: () => GamevaultUser,
  })
  user?: GamevaultUser;

  @Index()
  @ManyToOne(() => Game, (game) => game.progresses)
  @ApiPropertyOptional({
    description: "game the progress belongs to",
    type: () => Game,
  })
  game?: Game;

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
  @ApiPropertyOptional({
    description: "date the progress was updated",
    example: "2020-01-01T00:00:00.000Z",
  })
  last_played_at?: Date;
}
