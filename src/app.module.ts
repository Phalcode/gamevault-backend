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
import { APP_FILTER } from "@nestjs/core";
import { LoggingExceptionFilter } from "./modules/log/exception.filter";
import { RawgModule } from "./modules/providers/rawg/rawg.module";
import { DefaultStrategy } from "./modules/auth/basic-auth.strategy";
import { TypeOrmModule } from "@nestjs/typeorm";
import { getDatabaseConfiguration } from "./modules/database/db_configuration";
@Module({
  imports: [
    TypeOrmModule.forRoot(getDatabaseConfiguration()),
    ScheduleModule.forRoot(),
    BoxartsModule,
    DevelopersModule,
    PublishersModule,
    StoresModule,
    FilesModule,
    UsersModule,
    TagsModule,
    RawgModule,
    ProgressModule,
    ImagesModule,
    HealthModule,
    GenresModule,
    GamesModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: LoggingExceptionFilter },
    DefaultStrategy,
  ],
})
export class AppModule {}
