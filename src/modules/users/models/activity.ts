import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmpty, IsNotEmpty, IsOptional } from "class-validator";
import { ActivityState } from "./activity-state.enum";

export class Activity {
  @IsEmpty()
  userId?: number;

  @IsEmpty()
  socketId?: string;

  @ApiProperty({
    type: "enum",
    enum: ActivityState,
    example: ActivityState.PLAYING,
    description: "The online-state to set the user to",
  })
  @IsNotEmpty()
  state: ActivityState;

  @ApiPropertyOptional({
    description: "The games's id. Only required if the state is 'PLAYING'.",
  })
  @IsOptional()
  @IsNotEmpty()
  gameId?: number;
}
