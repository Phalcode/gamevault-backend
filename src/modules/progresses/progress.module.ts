import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { GamesModule } from "../games/games.module.js";
import { UsersModule } from "../users/users.module.js";
import { ProgressController } from "./progress.controller.js";
import { Progress } from "./progress.entity.js";
import { ProgressService } from "./progress.service.js";

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
