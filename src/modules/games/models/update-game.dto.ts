import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, ValidateNested } from "class-validator";

import { MapGameDto } from "./map-game.dto";

export class UpdateGameDto {
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

  @ValidateNested({ each: true })
  mapping_requests: MapGameDto[];
}
