import { ApiPropertyOptional } from "@nestjs/swagger";
import { Column, Entity, Index, ManyToOne } from "typeorm";

import { DatabaseEntity } from "../database/database.entity";
import { GamevaultUser } from "../users/gamevault-user.entity";

@Entity()
export class Media extends DatabaseEntity {
  @Column({ nullable: true })
  @ApiPropertyOptional({
    example:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Grand_Theft_Auto_logo_series.svg",
    description: "the original source URL of the media",
    pattern: "url",
  })
  source?: string;

  @Column({ unique: true, nullable: true })
  @Index()
  @ApiPropertyOptional({
    example: "/media/14",
    description: "the path of the media on the filesystem",
  })
  path?: string;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    example: "image/jpeg",
    description: "the media type of the media on the filesystem",
  })
  type?: string;

  @ManyToOne(() => GamevaultUser, (user) => user.uploaded_media, {
    nullable: true,
  })
  @ApiPropertyOptional({
    description: "the uploader of the media",
    type: () => GamevaultUser,
  })
  uploader?: GamevaultUser;
}
