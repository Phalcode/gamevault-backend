import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmpty, IsNotEmpty, IsOptional } from "class-validator";
import { ActivityState } from "./activity-state.enum";

export class Activity {
  @IsEmpty()
  user_id?: number;

  @IsEmpty()
  socket_id?: string;

  @ApiProperty({
    type: "enum",
    enum: ActivityState,
    example: ActivityState.PLAYING,
    description: "The online-state to set the user to",
  })
  @IsNotEmpty()
  state: ActivityState;

  @ApiPropertyOptional({
    description: "The game's id. Only required if the state is 'PLAYING'.",
  })
  @IsOptional()
  @IsNotEmpty()
  game_id?: number;
}
