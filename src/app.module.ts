import { ImagesController } from "./controllers/images.controller";
import { TagsController } from "./controllers/tags.controller";
import { AutomationService } from "./services/automation.service";
import { HealthController } from "./controllers/health.controller";
import { UsersService } from "./services/users.service";
import { UtilityController } from "./controllers/utility.controller";
import { BoxArtService } from "./services/box-art.service";
import { GenresService } from "./services/genres.service";
import { TagsService } from "./services/tags.service";
import { ProgressService } from "./services/progress.service";
import { PublishersService } from "./services/publishers.service";
import { DevelopersService } from "./services/developers.service";
import { StoresService } from "./services/stores.service";
import { MapperService } from "./services/mapper.service";
import { ProgressController } from "./controllers/progress.controller";
import { UsersController } from "./controllers/users.controller";
import { RawgController } from "./controllers/rawg.controller";
import { FilesService } from "./services/files.service";
import { GamesService } from "./services/games.service";
import { RawgService } from "./services/rawg.service";
import { GamesController } from "./controllers/games.controller";
import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Developer } from "./database/entities/developer.entity";
import { Game } from "./database/entities/game.entity";
import { Genre } from "./database/entities/genre.entity";
import { Progress } from "./database/entities/progress.entity";
import { Publisher } from "./database/entities/publisher.entity";
import { Store } from "./database/entities/store.entity";
import { Tag } from "./database/entities/tag.entity";
import { CrackpipeUser } from "./database/entities/crackpipe-user.entity";
import { DefaultStrategy } from "./auth/basic-auth.strategy";
import { GenresController } from "./controllers/genres.controller";
import { ImagesService } from "./services/images.service";
import { Image } from "./database/entities/image.entity";
import { HttpModule } from "@nestjs/axios";
import { getDatabaseConfiguration } from "./database/db_configuration";
import { APP_FILTER } from "@nestjs/core";
import { LoggingExceptionFilter } from "./errorhandling/logging-exception.filter";
import { AuthenticationGuard } from "./auth/authentication.guard";
import { AuthorizationGuard } from "./auth/authorization.guard";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot(getDatabaseConfiguration()),
    HttpModule,
    TypeOrmModule.forFeature([
      Game,
      Developer,
      Genre,
      Publisher,
      Progress,
      Store,
      Tag,
      CrackpipeUser,
      Image,
    ]),
  ],
  controllers: [
    ImagesController,
    TagsController,
    GenresController,
    HealthController,
    UtilityController,
    ProgressController,
    UsersController,
    GamesController,
    RawgController,
  ],
  providers: [
    { provide: APP_FILTER, useClass: LoggingExceptionFilter },
    AutomationService,
    DefaultStrategy,
    UsersService,
    BoxArtService,
    GenresService,
    TagsService,
    ProgressService,
    PublishersService,
    DevelopersService,
    StoresService,
    MapperService,
    FilesService,
    GamesService,
    RawgService,
    ImagesService,
    AuthenticationGuard,
    AuthorizationGuard,
  ],
})
export class AppModule {}
