import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import { IsNotIn, Matches } from "class-validator";
import globals from "../../../globals";

export class MinimalGameMetadataDto {
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
    examples: [
      "my-custom-metadata-provider",
      "igdb",
      "steam",
      "epic-games",
      "rawg-2-steam",
    ],
  })
  provider_slug: string;

  @ApiPropertyOptional({
    description: "id of the game from the provider",
    example: "Grand Theft Auto V",
  })
  provider_data_id?: string;

  @ApiPropertyOptional({
    description:
      "gamevault's calculated probability of the metadata being the correct one.",
    example: 0.5,
    minimum: 0,
    maximum: 1,
  })
  provider_probability?: number;

  @ApiProperty({
    description: "title of the game",
    example: "Grand Theft Auto V",
  })
  title: string;

  @ApiPropertyOptional({
    description: "release date of the game",
    example: "2013-09-17T00:00:00.000Z",
  })
  release_date?: Date;

  @ApiPropertyOptional({
    description: "box image url of the game",
    example: "example.com/example.jpg",
  })
  cover_url?: string;
}
