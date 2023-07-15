import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumberString } from "class-validator";

export class IncrementProgressByMinutesDto {
  @IsNumberString()
  @IsNotEmpty()
  @ApiProperty({
    example: "1",
    description: "Unique gamevault-identifier of the user",
  })
  userId: string;

  @IsNumberString()
  @IsNotEmpty()
  @ApiProperty({
    example: "1",
    description: "Unique gamevault-identifier of the game",
  })
  gameId: string;

  @IsNumberString()
  @IsNotEmpty()
  @ApiProperty({
    example: "1",
    description: "the amount of minutes to increment the progress by",
  })
  minutes: string;
}
