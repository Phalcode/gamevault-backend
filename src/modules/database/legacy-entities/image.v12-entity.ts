import { ApiPropertyOptional } from "@nestjs/swagger";
import { Column, Entity, Index, ManyToOne } from "typeorm";
import { DatabaseEntityV12 } from "./database.v12-entity";
import { GamevaultUserV12 } from "./gamevault-user.v12-entity";

@Entity("v12_image", { synchronize: false })
export class ImageV12 extends DatabaseEntityV12 {
  @Column({ nullable: true })
  @ApiPropertyOptional({
    example:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Grand_Theft_Auto_logo_series.svg",
    description: "the original source URL of the image",
    pattern: "url",
  })
  source?: string;

  @Column({ unique: true, nullable: true })
  @Index()
  @ApiPropertyOptional({
    example: "/images/14",
    description: "the path of the image on the filesystem",
  })
  path?: string;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    example: "image/jpeg",
    description: "the media type of the image on the filesystem",
  })
  mediaType?: string;

  @ManyToOne(() => GamevaultUserV12, (user) => user.uploaded_images, {
    nullable: true,
  })
  @ApiPropertyOptional({
    description: "the uploader of the image",
    type: () => GamevaultUserV12,
  })
  uploader?: GamevaultUserV12;
}
