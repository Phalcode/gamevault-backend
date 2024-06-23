import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { MediaModule } from "../media/media.module";
import { MetadataModule } from "../metadata/metadata.module";
import { ProgressModule } from "../progresses/progress.module";
import { FilesService } from "./files.service";
import { GamesController } from "./games.controller";
import { GamesService } from "./games.service";
import { GamevaultGame } from "./gamevault-game.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([GamevaultGame]),
    MediaModule,
    MetadataModule,
    ProgressModule,
  ],
  controllers: [GamesController],
  providers: [GamesService, FilesService],
  exports: [GamesService, FilesService],
})
export class GamesModule {}
