import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Column, Entity, Index, ManyToMany } from "typeorm";

import { DatabaseEntity } from "../../database/database.entity";
import { GameMetadata } from "./game-metadata.entity";

@Entity()
export class StoreMetadata extends DatabaseEntity {
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
    example: "Steam",
    description: "name of the store",
  })
  name: string;

  @ManyToMany(() => GameMetadata, (game) => game.stores)
  @ApiProperty({
    description: "games available on the store",
    type: () => GameMetadata,
    isArray: true,
  })
  games: GameMetadata[];
}
