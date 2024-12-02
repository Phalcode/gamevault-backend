import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from "class-validator";

import { State } from "./state.enum";

export class UpdateProgressDto {
  @IsOptional()
  @IsNumber()
  @IsNotEmpty()
  @ApiPropertyOptional({
    description:
      "minutes of progress in the game by the user, this can only be incremented or be equal to the current value",
    example: 22,
  })
  minutes_played: number;

  @IsOptional()
  @IsEnum(State)
  @IsNotEmpty()
  @ApiPropertyOptional({
    description: "the new state of the game progress",
    type: "string",
    enum: State,
    example: State.PLAYING,
  })
  state: State;
}
