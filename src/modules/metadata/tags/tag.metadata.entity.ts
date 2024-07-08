import { ApiProperty } from "@nestjs/swagger";
import { IsNotIn, Matches } from "class-validator";
import { Column, Entity, Index, ManyToMany } from "typeorm";

import globals from "../../../globals";
import { DatabaseEntity } from "../../database/database.entity";
import { GameMetadata } from "../games/game.metadata.entity";

@Entity()
@Index("UQ_TAG_METADATA", ["provider_slug", "provider_data_id"], {
  unique: true,
})
export class TagMetadata extends DatabaseEntity {
  @Column()
  @Index()
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

  @Column()
  @Index()
  @ApiProperty({
    description: "id of the developer from the provider",
    example: "1190",
  })
  provider_data_id: string;

  @Index()
  @Column({ unique: true })
  @ApiProperty({
    example: "battle-royale",
    description: "name of the tag",
  })
  name: string;

  @ManyToMany(() => GameMetadata, (game) => game.tags)
  @ApiProperty({
    description: "games tagged with the tag",
    type: () => GameMetadata,
    isArray: true,
  })
  games: GameMetadata[];
}