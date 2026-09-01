import { Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ScheduleModule } from "@nestjs/schedule";
import configuration, { gamevaultConfiguration } from "./configuration.js";
import { DisableApiIfInterceptor } from "./interceptors/disable-api-if.interceptor.js";
import { HttpLoggingInterceptor } from "./interceptors/http-logging.interceptor.js";
import { AdminModule } from "./modules/admin/admin.module.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { ConfigModule as ApiConfigModule } from "./modules/config/config.module.js";
import { DatabaseModule } from "./modules/database/database.module.js";
import { GamesModule } from "./modules/games/games.module.js";
import { GamevaultConfigModule } from "./modules/gamevault-config/gamevault-config.module.js";
import { GarbageCollectionModule } from "./modules/garbage-collection/garbage-collection.module.js";
import { MediaModule } from "./modules/media/media.module.js";
import { MetadataModule } from "./modules/metadata/metadata.module.js";
import { OtpModule } from "./modules/otp/otp.module.js";
import { ProgressModule } from "./modules/progresses/progress.module.js";
import { SavefileModule } from "./modules/savefiles/savefile.module.js";
import { ServerModule } from "./modules/server/server.module.js";
import { StatusModule } from "./modules/status/status.module.js";
import { UsersModule } from "./modules/users/users.module.js";
import { WebUIModule } from "./modules/web-ui/web-ui.module.js";

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
