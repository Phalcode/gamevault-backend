import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { MediaModule } from "../media/media.module";
import { MetadataModule } from "../metadata/metadata.module";
import { OtpModule } from "../otp/otp.module";
import { Progress } from "../progresses/progress.entity";
import { ProgressModule } from "../progresses/progress.module";
import { UsersModule } from "../users/users.module";
import { FilesService } from "./files.service";
import { GameVersionEntity } from "./game-version.entity";
import { GameVersionsController } from "./game-versions.controller";
import { GamesController } from "./games.controller";
import { GamesService } from "./games.service";
import { GamevaultGame } from "./gamevault-game.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([GamevaultGame, GameVersionEntity, Progress]),
    MediaModule,
    MetadataModule,
    ProgressModule,
    forwardRef(() => OtpModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [GamesController, GameVersionsController],
  providers: [GamesService, FilesService],
  exports: [GamesService, FilesService],
})
export class GamesModule {}
