import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, ValidateNested } from "class-validator";

import { UserGameMetadataDto } from "../../metadata/models/user-game-metadata.dto";
import { MapGameDto } from "./map-game.dto";

export class UpdateGameDto {
  @IsOptional()
  @ValidateNested()
  @ApiPropertyOptional({
    description:
      "The updated user metadata. If not provided, the games user_metadata will not be updated.",
    type: () => UserGameMetadataDto,
  })
  user_metadata?: UserGameMetadataDto;

  @IsOptional()
  @ValidateNested({ each: true })
  @ApiPropertyOptional({
    description:
      "The mapping requests. If not provided, the game will not be remapped.",
    type: MapGameDto,
    isArray: true,
  })
  mapping_requests?: MapGameDto[];
}
