import { ApiProperty } from "@nestjs/swagger";
import { Entity, Column, ManyToMany } from "typeorm";
import { Game } from "./game.entity";
import { AbstractEntity } from "./abstract.entity";

@Entity()
export class Store extends AbstractEntity {
  @Column({ unique: true })
  @ApiProperty({
    example: 1000,
    description: "unique rawg-api-identifier of the store",
  })
  rawg_id: number;

  @Column({ unique: true })
  @ApiProperty({
    example: "Steam",
    description: "name of the store",
  })
  name: string;

  @ManyToMany(() => Game, (game) => game.stores)
  @ApiProperty({
    description: "games available on the store",
    type: () => Game,
    isArray: true,
  })
  games: Game[];
}
