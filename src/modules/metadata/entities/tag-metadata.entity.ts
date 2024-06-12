import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Column, Entity, Index, ManyToMany } from "typeorm";

import { DatabaseEntity } from "../../database/database.entity";
import { GameMetadata } from "./game-metadata.entity";

@Entity()
@Index("UQ_TAG_METADATA", ["metadata_provider", "metadata_provider_id"], {
  unique: true,
})
export class TagMetadata extends DatabaseEntity {
  @Column()
  @Index()
  @ApiProperty({
    description: "provider slug of the metadata",
  })
  metadata_provider: string;

  @Column()
  @Index()
  @ApiPropertyOptional({
    description: "id of the developer from the provider",
    example: "1190",
  })
  metadata_provider_id?: string;

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
