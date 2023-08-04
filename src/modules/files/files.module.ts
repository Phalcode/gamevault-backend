import { Module } from "@nestjs/common";
import { FilesService } from "./files.service";
import { GamesModule } from "../games/games.module";

@Module({
  imports: [GamesModule],
  controllers: [],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
