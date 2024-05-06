import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Column, Entity, Index, ManyToMany } from "typeorm";

import { DatabaseEntity } from "../database/database.entity";
import { Game } from "../games/game.entity";

@Entity()
export class Genre extends DatabaseEntity {
  @Index()
  @Column({ nullable: true })
  @ApiPropertyOptional({
    example: 1000,
    description: "unique rawg-api-identifier of the genre",
  })
  rawg_id?: number;

  @Index()
  @Column({ unique: true })
  @ApiProperty({
    example: "Platformer",
    description: "name of the genre",
  })
  name: string;

  @ManyToMany(() => Game, (game) => game.genres)
  @ApiProperty({
    description: "games of the genre",
    type: () => Game,
    isArray: true,
  })
  games: Game[];
}
