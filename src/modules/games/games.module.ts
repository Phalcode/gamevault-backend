import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { MediaModule } from "../media/media.module.js";
import { MetadataModule } from "../metadata/metadata.module.js";
import { OtpModule } from "../otp/otp.module.js";
import { Progress } from "../progresses/progress.entity.js";
import { ProgressModule } from "../progresses/progress.module.js";
import { UsersModule } from "../users/users.module.js";
import { FilesService } from "./files.service.js";
import { GameVersion } from "./game-version.entity.js";
import { GameVersionsController } from "./game-versions.controller.js";
import { GamesController } from "./games.controller.js";
import { GamesService } from "./games.service.js";
import { GamevaultGame } from "./gamevault-game.entity.js";

@Module({
  imports: [
    TypeOrmModule.forFeature([GamevaultGame, GameVersion, Progress]),
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
