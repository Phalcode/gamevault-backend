import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumberString } from "class-validator";

export class ProgressIdDto {
  @IsNumberString()
  @IsNotEmpty()
  @ApiProperty({ example: "1", description: "id of the progress" })
  progress_id: number;
}
