import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Column, Entity, Index, ManyToMany } from "typeorm";
import { DatabaseEntityV12 } from "./database.v12-entity";
import { GameV12 } from "./game.v12-entity";

@Entity("v12_genre")
export class GenreV12 extends DatabaseEntityV12 {
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

  @ManyToMany(() => GameV12, (game) => game.genres)
  @ApiProperty({
    description: "games of the genre",
    type: () => GameV12,
    isArray: true,
  })
  games: GameV12[];
}
