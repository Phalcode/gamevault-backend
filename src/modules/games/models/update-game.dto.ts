import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsPositive } from "class-validator";

export class UpdateGameDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  @ApiPropertyOptional({
    example: 1000,
    description: "unique rawg-api-identifier of the game",
  })
  rawg_id?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({
    example: 69_420,
    description: "id of the image",
  })
  box_image_id?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({
    example: 69_420,
    description: "id of the image",
  })
  background_image_id?: number;
}
