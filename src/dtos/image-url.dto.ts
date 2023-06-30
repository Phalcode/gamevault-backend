import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsUrl } from "class-validator";

export class ImageUrlDto {
  @IsUrl()
  @IsNotEmpty()
  @ApiProperty({
    pattern: "url",
    example: "https://example.com/image.png",
    description: "url to the image",
  })
  image_url: string;
}
