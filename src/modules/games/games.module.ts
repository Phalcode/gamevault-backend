import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { MediaModule } from "../media/media.module";
import { GamevaultGame } from "./game.entity";
import { GamesController } from "./games.controller";
import { GamesService } from "./games.service";

@Module({
  imports: [TypeOrmModule.forFeature([GamevaultGame]), MediaModule],
  controllers: [GamesController],
  providers: [GamesService],
  exports: [GamesService],
})
export class GamesModule {}
