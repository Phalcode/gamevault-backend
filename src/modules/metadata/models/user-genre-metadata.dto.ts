import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class UserGenreMetadataDto {
  @Min(0)
  @IsInt()
  @IsOptional()
  @IsNotEmpty()
  @ApiPropertyOptional({
    description:
      "ID of the genre. Fill this to reuse an existing one. Then all other values are ignored.",
    example: 1,
  })
  id?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional({
    example: "Platformer",
    description: "name of the genre",
  })
  name?: string;
}
