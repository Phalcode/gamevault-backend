import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumberString } from "class-validator";

export class UserIdGameIdDto {
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
}
