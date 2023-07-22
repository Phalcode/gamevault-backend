import { ApiProperty } from "@nestjs/swagger";
import { Entity, Column, ManyToMany } from "typeorm";
import { Game } from "./game.entity";
import { AbstractEntity } from "./abstract.entity";

@Entity()
export class Developer extends AbstractEntity {
  @Column({ unique: true })
  @ApiProperty({
    example: 1000,
    description: "unique rawg-api-identifier of the developer",
  })
  rawg_id: number;

  @Column({ unique: true })
  @ApiProperty({
    example: "Rockstar North",
    description: "name of the developer",
  })
  name: string;

  @ManyToMany(() => Game, (game) => game.developers)
  @ApiProperty({
    description: "games developed by the developer",
    type: Game,
    isArray: true,
  })
  games: Game[];
}
