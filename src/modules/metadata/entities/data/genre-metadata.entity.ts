import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Column, Entity, Index, ManyToMany, ManyToOne } from "typeorm";

import { DatabaseEntity } from "../../../database/database.entity";
import { GamevaultGame } from "../../../games/game.entity";
import { MetadataProvider } from "../metadata-provider.entity";
import { GameMetadata } from "./game-metadata.entity";

@Entity()
export class GenreMetadata extends DatabaseEntity {
  @ManyToOne(() => MetadataProvider, (provider) => provider.genres)
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
    example: "Platformer",
    description: "name of the genre",
  })
  name: string;

  @ManyToMany(() => GameMetadata, (game) => game.genres)
  @ApiProperty({
    description: "games of the genre",
    type: () => GamevaultGame,
    isArray: true,
  })
  games: GamevaultGame[];
}
