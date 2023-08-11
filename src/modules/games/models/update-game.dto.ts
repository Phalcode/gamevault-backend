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
  @IsNotEmpty()
  @ApiProperty({
    pattern: "url",
    example: "https://example.com/image.png",
    description: "url to the image",
  })
  box_image?: string;
}
