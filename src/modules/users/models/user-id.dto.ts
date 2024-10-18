import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumberString } from "class-validator";

export class UserIdDto {
  @IsNumberString()
  @IsNotEmpty()
  @ApiProperty({ example: "1", description: "id of the user" })
  user_id: number;
}
