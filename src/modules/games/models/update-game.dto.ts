import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUrl,
} from "class-validator";

export class UpdateGameDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  @ApiProperty({
    example: 1000,
    description: "unique rawg-api-identifier of the game",
  })
  rawg_id?: number;

  @IsOptional()
  @IsUrl()
  @ApiProperty({
    pattern: "url",
    example: "https://example.com/image.png",
    description: "url to the image",
  })
  box_image_url?: string;

  @IsOptional()
  @IsNumber()
  @ApiProperty({
    example: 69_420,
    description: "id of the image",
  })
  box_image_id?: number;

  @IsOptional()
  @IsUrl()
  @ApiProperty({
    pattern: "url",
    example: "https://example.com/image.png",
    description: "url to the image",
  })
  background_image_url?: string;

  @IsOptional()
  @IsNumber()
  @ApiProperty({
    example: 69_420,
    description: "id of the image",
  })
  background_image_id?: number;
}
