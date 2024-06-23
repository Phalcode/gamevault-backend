import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Column, Entity, Index, ManyToMany } from "typeorm";

import { DatabaseEntity } from "../../database/database.entity";
import { GameMetadata } from "../games/game.metadata.entity";

@Entity()
@Index("UQ_DEVELOPER_METADATA", ["provider", "provider_data_id"], {
  unique: true,
})
export class DeveloperMetadata extends DatabaseEntity {
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
    example: "Rockstar North",
    description: "name of the developer",
  })
  name: string;

  @ManyToMany(() => GameMetadata, (game) => game.developers)
  @ApiProperty({
    description: "games developed by the developer",
    type: () => GameMetadata,
    isArray: true,
  })
  games: GameMetadata[];
}
