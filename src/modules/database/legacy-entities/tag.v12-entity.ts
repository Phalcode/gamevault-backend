import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Column, Entity, Index, ManyToMany } from "typeorm";

import { DatabaseEntity } from "./database.v12-entity";
import { Game } from "./game.v12-entity";

@Entity()
export class Tag extends DatabaseEntity {
  @Index()
  @Column({ nullable: true })
  @ApiPropertyOptional({
    example: 1000,
    description: "unique rawg-api-identifier of the tag",
  })
  rawg_id?: number;

  @Index()
  @Column({ unique: true })
  @ApiProperty({
    example: "battle-royale",
    description: "name of the tag",
  })
  name: string;

  @ManyToMany(() => Game, (game) => game.tags)
  @ApiProperty({
    description: "games tagged with the tag",
    type: () => Game,
    isArray: true,
  })
  games: Game[];
}
