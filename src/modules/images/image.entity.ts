import { ApiProperty } from "@nestjs/swagger";
import { Entity, Column, Index } from "typeorm";
import { DatabaseEntity } from "../database/database.entity";

@Entity()
export class Image extends DatabaseEntity {
  @Index()
  @Column({ unique: true })
  @ApiProperty({
    example:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Grand_Theft_Auto_logo_series.svg",
    description: "the original source of the image",
    pattern: "url",
  })
  source: string;

  @Column({ unique: true, nullable: true })
  @Index()
  @ApiProperty({
    example: "/images/14",
    description: "the path of the image on the filesystem",
  })
  path: string;

  @Column({ nullable: true })
  @ApiProperty({
    example: "image/jpeg",
    description: "the media type of the image on the filesystem",
  })
  mediaType: string;

  @Column({ nullable: false })
  @ApiProperty({
    description: "date the image was last accessed",
    example: "2021-03-01T00:00:00.000Z",
  })
  last_accessed_at: Date;
}
