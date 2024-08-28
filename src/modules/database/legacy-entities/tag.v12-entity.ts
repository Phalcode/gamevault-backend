import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Column, Entity, Index, ManyToMany } from "typeorm";

import { DatabaseEntityV12 } from "./database.v12-entity";
import { GameV12 } from "./game.v12-entity";

@Entity("v12_tag")
export class TagV12 extends DatabaseEntityV12 {
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

  @ManyToMany(() => GameV12, (game) => game.tags)
  @ApiProperty({
    description: "games tagged with the tag",
    type: () => GameV12,
    isArray: true,
  })
  games: GameV12[];
}
