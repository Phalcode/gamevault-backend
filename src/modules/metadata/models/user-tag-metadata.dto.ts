import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class UserTagMetadataDto {
  @Min(0)
  @IsInt()
  @IsOptional()
  @IsNotEmpty()
  @ApiPropertyOptional({
    description:
      "ID of the tag. Fill this to reuse an existing one. Then all other values are ignored.",
    example: 1,
  })
  id?: number;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @ApiPropertyOptional({
    example: "battle-royale",
    description: "name of the tag",
  })
  name?: string;
}
