import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { BoxartsModule } from "../boxarts/boxarts.module";
import { FilesModule } from "../files/files.module";
import { ImagesModule } from "../images/images.module";
import { RawgModule } from "../providers/rawg/rawg.module";
import { Game } from "./game.entity";
import { GamesController } from "./games.controller";
import { GamesService } from "./games.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Game]),
    forwardRef(() => RawgModule),
    forwardRef(() => FilesModule),
    forwardRef(() => BoxartsModule),
    ImagesModule,
  ],
  controllers: [GamesController],
  providers: [GamesService],
  exports: [GamesService],
})
export class GamesModule {}
