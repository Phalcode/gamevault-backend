import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Column, Entity, Index, ManyToMany } from "typeorm";
import { DatabaseEntity } from "./database.v12-entity";
import { Game } from "./game.v12-entity";

@Entity()
export class Store extends DatabaseEntity {
  @Index()
  @Column({ nullable: true })
  @ApiPropertyOptional({
    example: 1000,
    description: "unique rawg-api-identifier of the store",
  })
  rawg_id?: number;

  @Index()
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
