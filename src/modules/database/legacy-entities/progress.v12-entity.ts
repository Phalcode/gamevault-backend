import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Column, Entity, Index, ManyToOne } from "typeorm";
import { State } from "../../progresses/models/state.enum";
import { DatabaseEntityV12 } from "./database.v12-entity";
import { GameV12 } from "./game.v12-entity";
import { GamevaultUserV12 } from "./gamevault-user.v12-entity";

@Entity("v12_progress", { synchronize: false })
export class ProgressV12 extends DatabaseEntityV12 {
  @Index()
  @ManyToOne(() => GamevaultUserV12, (user) => user.progresses)
  @ApiPropertyOptional({
    description: "user the progress belongs to",
    type: () => GamevaultUserV12,
  })
  user?: GamevaultUserV12;

  @Index()
  @ManyToOne(() => GameV12, (game) => game.progresses)
  @ApiPropertyOptional({
    description: "game the progress belongs to",
    type: () => GameV12,
  })
  game?: GameV12;

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
