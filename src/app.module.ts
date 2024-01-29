import { AdminModule } from "./modules/admin/admin.module";
import { DatabaseModule } from "./modules/database/database.module";
import { FilesModule } from "./modules/files/files.module";
import { BoxartsModule } from "./modules/boxarts/boxarts.module";
import { DevelopersModule } from "./modules/developers/developers.module";
import { PublishersModule } from "./modules/publishers/publishers.module";
import { StoresModule } from "./modules/stores/stores.module";
import { UsersModule } from "./modules/users/users.module";
import { TagsModule } from "./modules/tags/tags.module";
import { ProgressModule } from "./modules/progress/progress.module";
import { ImagesModule } from "./modules/images/images.module";
import { HealthModule } from "./modules/health/health.module";
import { GenresModule } from "./modules/genres/genres.module";
import { GamesModule } from "./modules/games/games.module";
import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { RawgModule } from "./modules/providers/rawg/rawg.module";
import { DefaultStrategy } from "./modules/guards/basic-auth.strategy";
import { GarbageCollectionModule } from "./modules/garbage-collection/garbage-collection.module";
import { EventEmitterModule } from "@nestjs/event-emitter";

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
  ],
  providers: [DefaultStrategy],
})
export class AppModule {}
