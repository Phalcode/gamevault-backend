import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Column, Entity, Index, ManyToMany } from "typeorm";
import { DatabaseEntityV12 } from "./database.v12-entity";
import { GameV12 } from "./game.v12-entity";

@Entity("v12_store")
export class StoreV12 extends DatabaseEntityV12 {
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

  @ManyToMany(() => GameV12, (game) => game.stores)
  @ApiProperty({
    description: "games available on the store",
    type: () => GameV12,
    isArray: true,
  })
  games: GameV12[];
}
