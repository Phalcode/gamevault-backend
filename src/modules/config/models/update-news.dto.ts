import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class UpdateNewsDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: "# Welcome\nThis is the latest news.",
    description: "the markdown content of the news.md file",
  })
  content!: string;
}
