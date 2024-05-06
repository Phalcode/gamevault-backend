import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Column, Entity, Index, ManyToMany } from "typeorm";

import { DatabaseEntity } from "../database/database.entity";
import { Game } from "../games/game.entity";

@Entity()
export class Developer extends DatabaseEntity {
  @Index()
  @Column({ nullable: true })
  @ApiPropertyOptional({
    example: 1000,
    description: "unique rawg-api-identifier of the developer",
  })
  rawg_id?: number;

  @Index()
  @Column({ unique: true })
  @ApiProperty({
    example: "Rockstar North",
    description: "name of the developer",
  })
  name: string;

  @ManyToMany(() => Game, (game) => game.developers)
  @ApiProperty({
    description: "games developed by the developer",
    type: () => Game,
    isArray: true,
  })
  games: Game[];
}
