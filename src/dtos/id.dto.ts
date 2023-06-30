import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumberString } from "class-validator";

export class IdDto {
  @IsNumberString()
  @IsNotEmpty()
  @ApiProperty({ example: "1", description: "id of the entity" })
  id: string;
}
