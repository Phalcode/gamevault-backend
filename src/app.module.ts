import { Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ScheduleModule } from "@nestjs/schedule";
import configuration, { gamevaultConfiguration } from "./configuration";
import { DisableApiIfInterceptor } from "./interceptors/disable-api-if.interceptor";
import { HttpLoggingInterceptor } from "./interceptors/http-logging.interceptor";
import { AdminModule } from "./modules/admin/admin.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ConfigModule as ApiConfigModule } from "./modules/config/config.module";
import { DatabaseModule } from "./modules/database/database.module";
import { GamesModule } from "./modules/games/games.module";
import { GamevaultConfigModule } from "./modules/gamevault-config/gamevault-config.module";
import { GarbageCollectionModule } from "./modules/garbage-collection/garbage-collection.module";
import { MediaModule } from "./modules/media/media.module";
import { MetadataModule } from "./modules/metadata/metadata.module";
import { OtpModule } from "./modules/otp/otp.module";
import { ProgressModule } from "./modules/progresses/progress.module";
import { SavefileModule } from "./modules/savefiles/savefile.module";
import { ServerModule } from "./modules/server/server.module";
import { StatusModule } from "./modules/status/status.module";
import { UsersModule } from "./modules/users/users.module";
import { WebUIModule } from "./modules/web-ui/web-ui.module";

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [gamevaultConfiguration],
    }),
    GamevaultConfigModule,
    OtpModule,
    ApiConfigModule,
    AuthModule,
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
    ServerModule,
    StatusModule,
    ...(configuration.WEB_UI.ENABLED ? [WebUIModule] : []),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: DisableApiIfInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
  ],
})
export class AppModule {}
