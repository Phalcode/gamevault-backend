import { ApiProperty } from "@nestjs/swagger";
import { Entity, Column, ManyToMany } from "typeorm";
import { Game } from "./game.entity";
import { AbstractEntity } from "./abstract.entity";

@Entity()
export class Genre extends AbstractEntity {
  @Column({ unique: true })
  @ApiProperty({
    example: 1000,
    description: "unique rawg-api-identifier of the genre",
  })
  rawg_id: number;

  @Column({ unique: true })
  @ApiProperty({
    example: "Platformer",
    description: "name of the genre",
  })
  name: string;

  @ManyToMany(() => Game, (game) => game.genres)
  @ApiProperty({
    description: "games of the genre",
    type: Game,
    isArray: true,
  })
  games?: Game[];
}
