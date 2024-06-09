import { ApiPropertyOptional } from "@nestjs/swagger";

import { Media } from "../../media/media.entity";

export class MinimalGame {
  @ApiPropertyOptional({
    description: "unique gamevault-identifier of the game",
    example: 1212,
  })
  id?: number;

  @ApiPropertyOptional({
    description: "unique rawg-api-identifier of the game",
    example: 1212,
  })
  rawg_id?: number;

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
