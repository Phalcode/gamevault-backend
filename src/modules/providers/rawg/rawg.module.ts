import { HttpModule } from "@nestjs/axios";
import { forwardRef, Module } from "@nestjs/common";

import { BoxartsModule } from "../../boxarts/boxarts.module";
import { DevelopersModule } from "../../developers/developers.module";
import { GamesModule } from "../../games/games.module";
import { GenresModule } from "../../genres/genres.module";
import { ImagesModule } from "../../images/images.module";
import { PublishersModule } from "../../publishers/publishers.module";
import { StoresModule } from "../../stores/stores.module";
import { TagsModule } from "../../tags/tags.module";
import { RawgMapperService } from "./mapper.service";
import { RawgController } from "./rawg.controller";
import { RawgService } from "./rawg.service";

@Module({
  imports: [
    forwardRef(() => GamesModule),
    forwardRef(() => BoxartsModule),
    HttpModule,
    TagsModule,
    GenresModule,
    PublishersModule,
    DevelopersModule,
    StoresModule,
    ImagesModule,
  ],
  controllers: [RawgController],
  providers: [RawgService, RawgMapperService],
  exports: [RawgService],
})
export class RawgModule {}
