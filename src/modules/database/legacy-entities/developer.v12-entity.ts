import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Column, Entity, Index, ManyToMany } from "typeorm";
import { DatabaseEntityV12 } from "./database.v12-entity";
import { GameV12 } from "./game.v12-entity";

@Entity("v12_developer")
export class DeveloperV12 extends DatabaseEntityV12 {
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

  @ManyToMany(() => GameV12, (game) => game.developers)
  @ApiProperty({
    description: "games developed by the developer",
    type: () => GameV12,
    isArray: true,
  })
  games: GameV12[];
}
