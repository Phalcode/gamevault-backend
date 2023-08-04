import { ApiProperty } from "@nestjs/swagger";
import { Entity, Column, ManyToMany } from "typeorm";
import { Game } from "../games/game.entity";
import { DatabaseEntity } from "../database/database.entity";

@Entity()
export class Publisher extends DatabaseEntity {
  @Column({ unique: true })
  @ApiProperty({
    example: 1000,
    description: "unique rawg-api-identifier of the publisher",
  })
  rawg_id: number;

  @Column({ unique: true })
  @ApiProperty({
    example: "Rockstar Games",
    description: "name of the publisher",
  })
  name: string;

  @ManyToMany(() => Game, (game) => game.publishers)
  @ApiProperty({
    description: "games published by the publisher",
    type: Game,
    isArray: true,
  })
  games: Game[];
}
