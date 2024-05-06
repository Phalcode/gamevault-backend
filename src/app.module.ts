import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ScheduleModule } from "@nestjs/schedule";

import { DisableApiIfInterceptor } from "./interceptors/disable-api-if.interceptor";
import { AdminModule } from "./modules/admin/admin.module";
import { BoxartsModule } from "./modules/boxarts/boxarts.module";
import { DatabaseModule } from "./modules/database/database.module";
import { DevelopersModule } from "./modules/developers/developers.module";
import { FilesModule } from "./modules/files/files.module";
import { GamesModule } from "./modules/games/games.module";
import { GarbageCollectionModule } from "./modules/garbage-collection/garbage-collection.module";
import { GenresModule } from "./modules/genres/genres.module";
import { DefaultStrategy } from "./modules/guards/basic-auth.strategy";
import { HealthModule } from "./modules/health/health.module";
import { ImagesModule } from "./modules/images/images.module";
import { PluginModule } from "./modules/plugins/plugin.module";
import { ProgressModule } from "./modules/progresses/progress.module";
import { RawgModule } from "./modules/providers/rawg/rawg.module";
import { PublishersModule } from "./modules/publishers/publishers.module";
import { StoresModule } from "./modules/stores/stores.module";
import { TagsModule } from "./modules/tags/tags.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    GarbageCollectionModule,
    AdminModule,
    DatabaseModule,
    ScheduleModule.forRoot(),
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
    EventEmitterModule.forRoot(),
    PluginModule,
  ],
  providers: [
    DefaultStrategy,
    {
      provide: APP_INTERCEPTOR,
      useClass: DisableApiIfInterceptor,
    },
  ],
})
export class AppModule {}
