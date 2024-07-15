import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, ValidateNested } from "class-validator";

import { GameMetadata } from "../../metadata/games/game.metadata.entity";
import { MapGameDto } from "./map-game.dto";

export class UpdateGameDto {
  @IsOptional()
  @ValidateNested()
  @ApiPropertyOptional({
    description:
      "The updated user metadata. If not provided, the user_metadata will not be updated.",
    type: GameMetadata,
  })
  user_metadata?: GameMetadata;

  @IsOptional()
  @ValidateNested({ each: true })
  @ApiPropertyOptional({
    description:
      "The mapping requests. If not provided, the game will not be remapped.",
    type: GameMetadata,
  })
  mapping_requests?: MapGameDto[];
}
