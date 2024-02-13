import { Module, forwardRef } from "@nestjs/common";
import { RawgService } from "./rawg.service";
import { RawgController } from "./rawg.controller";
import { RawgMapperService } from "./mapper.service";
import { GamesModule } from "../../games/games.module";
import { BoxartsModule } from "../../boxarts/boxarts.module";
import { HttpModule } from "@nestjs/axios";
import { TagsModule } from "../../tags/tags.module";
import { GenresModule } from "../../genres/genres.module";
import { PublishersModule } from "../../publishers/publishers.module";
import { DevelopersModule } from "../../developers/developers.module";
import { StoresModule } from "../../stores/stores.module";
import { ImagesModule } from "../../images/images.module";

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
