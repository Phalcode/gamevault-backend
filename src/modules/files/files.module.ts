import { forwardRef, Module } from "@nestjs/common";

import { BoxartsModule } from "../boxarts/boxarts.module";
import { GamesModule } from "../games/games.module";
import { RawgModule } from "../providers/rawg/rawg.module";
import { FilesController } from "./files.controller";
import { FilesService } from "./files.service";

@Module({
  imports: [
    forwardRef(() => GamesModule),
    forwardRef(() => RawgModule),
    forwardRef(() => BoxartsModule),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
