import { Module } from "@nestjs/common";
import { PluginService } from "./plugin.service";
import { AdminModule } from "../admin/admin.module";
import { BoxartsModule } from "../boxarts/boxarts.module";
import { DatabaseModule } from "../database/database.module";
import { DevelopersModule } from "../developers/developers.module";
import { FilesModule } from "../files/files.module";
import { GamesModule } from "../games/games.module";
import { GarbageCollectionModule } from "../garbage-collection/garbage-collection.module";
import { GenresModule } from "../genres/genres.module";
import { HealthModule } from "../health/health.module";
import { ImagesModule } from "../images/images.module";
import { ProgressModule } from "../progress/progress.module";
import { RawgModule } from "../providers/rawg/rawg.module";
import { PublishersModule } from "../publishers/publishers.module";
import { StoresModule } from "../stores/stores.module";
import { TagsModule } from "../tags/tags.module";
import { UsersModule } from "../users/users.module";

@Module({
  providers: [PluginService],
  exports: [PluginService],
  imports: [
    GarbageCollectionModule,
    AdminModule,
    DatabaseModule,
    BoxartsModule,
    DevelopersModule,
    PublishersModule,
    StoresModule,
    FilesModule,
    UsersModule,
    ImagesModule,
    TagsModule,
    RawgModule,
    ProgressModule,
    HealthModule,
    GenresModule,
    GamesModule,
  ],
})
export class PluginModule {}
