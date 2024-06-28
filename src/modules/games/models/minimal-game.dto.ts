import { ApiPropertyOptional } from "@nestjs/swagger";

import { Media } from "../../media/media.entity";

export class MinimalGameDto {
  @ApiPropertyOptional({
    description: "unique gamevault-identifier of the game",
    example: 1212,
  })
  id?: number;

  @ApiPropertyOptional({
    description: "provider slug of the metadata",
    example: "igdb",
    pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
  })
  provider_slug?: string;

  @ApiPropertyOptional({
    description: "unique rawg-api-identifier of the game",
    example: 1212,
  })
  provider_data_id?: string;

  @ApiPropertyOptional({
    description: "Probability of the metadata being the correct one.",
    example: 0.5,
    minimum: 0,
    maximum: 1,
  })
  provider_probability?: number;

  @ApiPropertyOptional({
    description: "title of the game",
    example: "Grand Theft Auto V",
  })
  title?: string;

  @ApiPropertyOptional({
    description: "release date of the game",
    example: "2013-09-17T00:00:00.000Z",
  })
  release_date?: Date;

  @ApiPropertyOptional({
    description: "box image of the game",
    type: () => Media,
  })
  box_image?: Media;

  @ApiPropertyOptional({
    description: "box image url of the game",
    example: "example.com/example.jpg",
  })
  box_image_url?: string;
}
