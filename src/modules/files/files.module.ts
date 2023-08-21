import { FilesController } from "./files.controller";
import { Module } from "@nestjs/common";
import { FilesService } from "./files.service";
import { GamesModule } from "../games/games.module";
import { RawgModule } from "../providers/rawg/rawg.module";
import { BoxartsModule } from "../boxarts/boxarts.module";

@Module({
  imports: [GamesModule, RawgModule, BoxartsModule],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
