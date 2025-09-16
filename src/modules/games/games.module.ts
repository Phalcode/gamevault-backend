import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { MediaModule } from "../media/media.module";
import { MetadataModule } from "../metadata/metadata.module";
import { OtpModule } from "../otp/otp.module";
import { ProgressModule } from "../progresses/progress.module";
import { UsersModule } from "../users/users.module";
import { FilesService } from "./files.service";
import { GamesController } from "./games.controller";
import { GamesService } from "./games.service";
import { GamevaultGame } from "./gamevault-game.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([GamevaultGame]),
    MediaModule,
    MetadataModule,
    ProgressModule,
    forwardRef(() => OtpModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [GamesController],
  providers: [GamesService, FilesService],
  exports: [GamesService, FilesService],
})
export class GamesModule {}
