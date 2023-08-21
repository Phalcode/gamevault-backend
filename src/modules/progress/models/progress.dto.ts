import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumber } from "class-validator";
import { State } from "./state.enum";

export class ProgressDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: "minutes of progress in the game by the user",
    example: 22,
  })
  minutes_played: number;

  @IsEnum(State)
  @IsNotEmpty()
  @ApiProperty({
    description: "state of the game progress",
    type: "enum",
    enum: State,
    example: State.PLAYING,
  })
  state: State;
}
