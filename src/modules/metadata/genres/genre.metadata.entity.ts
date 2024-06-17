import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Column, Entity, Index, ManyToMany } from "typeorm";

import { DatabaseEntity } from "../../database/database.entity";
import { GamevaultGame } from "../../games/game.entity";
import { GameMetadata } from "../games/game.metadata.entity";

@Entity()
@Index("UQ_GENRE_METADATA", ["metadata_provider", "metadata_provider_id"], {
  unique: true,
})
export class GenreMetadata extends DatabaseEntity {
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
