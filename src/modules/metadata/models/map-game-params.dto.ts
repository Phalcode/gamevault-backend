import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumberString, Matches } from "class-validator";

import { GameIdDto } from "../../games/models/game-id.dto";
import { ProviderSlugDto } from "../providers/models/provider-slug.dto";

export class MapGameParamsDto implements ProviderSlugDto, GameIdDto {
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      "Invalid slug: Only lowercase letters, numbers, and single hyphens inbetween them are allowed.",
  })
  @ApiProperty({
    description:
      "slug (url-friendly name) of the provider. This is the primary identifier. Must be formatted like a valid slug.",
    example: "igdb",
  })
  provider_slug: string;

  @IsNumberString()
  @IsNotEmpty()
  @ApiProperty({ example: "1", description: "id of the game" })
  game_id: number;
}
