import { ApiProperty } from "@nestjs/swagger";
import { Entity, Column, ManyToMany, Index } from "typeorm";
import { Game } from "../games/game.entity";
import { DatabaseEntity } from "../database/database.entity";

@Entity()
export class Tag extends DatabaseEntity {
  @Index()
  @Column({ unique: true })
  @ApiProperty({
    example: 1000,
    description: "unique rawg-api-identifier of the tag",
  })
  rawg_id: number;

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
