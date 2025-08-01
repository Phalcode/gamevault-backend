import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsNotEmpty,
  IsNotIn,
  IsOptional,
  Matches,
} from "class-validator";

import globals from "../../../globals";

export class MapGameDto {
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      "Invalid slug: Only lowercase letters, numbers, and single hyphens inbetween them are allowed.",
  })
  @IsNotIn(globals.RESERVED_PROVIDER_SLUGS, {
    message:
      "Invalid slug: The terms 'gamevault' and 'user' are reserved slugs.",
  })
  @ApiProperty({
    description:
      "slug (url-friendly name) of the provider. This is the primary identifier. Must be formatted like a valid slug.",
    example: "igdb",
  })
  provider_slug: string;

  @IsOptional()
  @ApiPropertyOptional({
    description:
      "id of the target game from the provider. If not provided, the metadata for the specified provider will be unmapped.",
    example: "1234",
  })
  provider_data_id?: string;

  @IsInt()
  @IsOptional()
  @ApiProperty({
    type: Number,
    description:
      "used to override the priority of usage for this provider. Lower priority providers are tried first, while higher priority providers fill in gaps.",
  })
  provider_priority?: number;
}
