import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ScheduleModule } from "@nestjs/schedule";
import { DisableApiIfInterceptor } from "./interceptors/disable-api-if.interceptor";
import { AdminModule } from "./modules/admin/admin.module";
import { ConfigModule } from "./modules/config/config.module";
import { DatabaseModule } from "./modules/database/database.module";
import { GamesModule } from "./modules/games/games.module";
import { GarbageCollectionModule } from "./modules/garbage-collection/garbage-collection.module";
import { DefaultStrategy } from "./modules/guards/basic-auth.strategy";
import { HealthModule } from "./modules/health/health.module";
import { MediaModule } from "./modules/media/media.module";
import { MetadataModule } from "./modules/metadata/metadata.module";
import { ProgressModule } from "./modules/progresses/progress.module";
import { SavefileModule } from "./modules/savefiles/savefile.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    MediaModule,
    GamesModule,
    UsersModule,
    ProgressModule,
    SavefileModule,
    MetadataModule,
    AdminModule,
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    GarbageCollectionModule,
    HealthModule,
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
