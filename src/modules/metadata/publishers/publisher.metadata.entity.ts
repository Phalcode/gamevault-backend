import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Column, Entity, Index, ManyToMany } from "typeorm";

import { DatabaseEntity } from "../../database/database.entity";
import { GameMetadata } from "../games/game.metadata.entity";

@Entity()
@Index("UQ_PUBLISHER_METADATA", ["provider", "provider_data_id"], {
  unique: true,
})
export class PublisherMetadata extends DatabaseEntity {
  @Column()
  @Index()
  @ApiProperty({
    description: "provider slug of the metadata",
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
    example: "Rockstar Games",
    description: "name of the publisher",
  })
  name: string;

  @ManyToMany(() => GameMetadata, (game) => game.publishers)
  @ApiProperty({
    description: "games published by the publisher",
    type: () => GameMetadata,
    isArray: true,
  })
  games: GameMetadata[];
}
