import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmpty, IsNotEmpty } from "class-validator";
import { ActivityState } from "./activity-state.enum";
import { Optional } from "@nestjs/common";

export class Activity {
  @IsEmpty()
  userId?: number;
  @IsEmpty()
  userSocketId?: string;

  @ApiProperty({
    type: "enum",
    enum: ActivityState,
    example: ActivityState.PLAYING,
    description: "The online-state to set the user to",
  })
  @IsNotEmpty()
  state: ActivityState;

  @ApiPropertyOptional({ description: "The games's id" })
  @Optional()
  @IsNotEmpty()
  gameId?: number;
}
