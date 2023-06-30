import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsPositive } from "class-validator";

export class OverwriteGameRawgIdDto {
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  @ApiProperty({
    example: 1000,
    description: "unique rawg-api-identifier of the game",
  })
  rawg_id: number;
}
