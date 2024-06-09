import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Column, Entity, Index, ManyToMany, ManyToOne } from "typeorm";

import { DatabaseEntity } from "../../../database/database.entity";
import { MetadataProvider } from "../metadata-provider.entity";
import { GameMetadata } from "./game-metadata.entity";

@Entity()
export class DeveloperMetadata extends DatabaseEntity {
  @ManyToOne(() => MetadataProvider, (provider) => provider.developers)
  @ApiProperty({
    description: "provider of the metadata",
    type: () => MetadataProvider,
  })
  metadata_provider: MetadataProvider;

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
