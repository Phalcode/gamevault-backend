import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { GamesModule } from "../games/games.module";
import { UsersModule } from "../users/users.module";
import { ProgressController } from "./progress.controller";
import { Progress } from "./progress.entity";
import { ProgressService } from "./progress.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Progress]),
    forwardRef(() => UsersModule),
    forwardRef(() => GamesModule),
  ],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
