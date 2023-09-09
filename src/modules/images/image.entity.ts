import { ApiProperty } from "@nestjs/swagger";
import { Entity, Column, Index, ManyToOne } from "typeorm";
import { DatabaseEntity } from "../database/database.entity";
import { GamevaultUser } from "../users/gamevault-user.entity";

@Entity()
export class Image extends DatabaseEntity {
  @Index()
  @Column({ nullable: true })
  @ApiProperty({
    example:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Grand_Theft_Auto_logo_series.svg",
    description: "the original source URL of the image",
    pattern: "url",
  })
  source?: string;

  @Column({ unique: true, nullable: true })
  @Index()
  @ApiProperty({
    example: "/images/14",
    description: "the path of the image on the filesystem",
  })
  path?: string;

  @Column({ nullable: true })
  @ApiProperty({
    example: "image/jpeg",
    description: "the media type of the image on the filesystem",
  })
  mediaType?: string;

  @ManyToOne(() => GamevaultUser, (user) => user.uploaded_images, {
    nullable: true,
  })
  @ApiProperty({
    description: "the uploader of the image",
    type: () => GamevaultUser,
    nullable: true,
  })
  uploader?: GamevaultUser;
}
