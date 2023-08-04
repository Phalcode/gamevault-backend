import { Module, forwardRef } from "@nestjs/common";
import { GamesController } from "./games.controller";
import { GamesService } from "./games.service";
import { Game } from "./game.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RawgModule } from "../providers/rawg/rawg.module";
import { BoxartsModule } from "../boxarts/boxarts.module";
import { FilesModule } from "../files/files.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Game]),
    RawgModule,
    BoxartsModule,
    forwardRef(() => FilesModule),
  ],
  controllers: [GamesController],
  providers: [GamesService],
  exports: [GamesService],
})
export class GamesModule {}
