import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class MapGameBodyDto {
  @IsNotEmpty()
  @ApiProperty({
    description:
      "Target id of the game this game should be mapped to from the metadata provider. Can be found in the provider's API or website.",
    example: "12345",
  })
  provider_game_id: string;
}
