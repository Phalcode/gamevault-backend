import { Module } from "@nestjs/common";
import { ProgressService } from "./progress.service";
import { ProgressController } from "./progress.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Progress } from "./progress.entity";
import { UsersModule } from "../users/users.module";
import { GamesModule } from "../games/games.module";

@Module({
  imports: [TypeOrmModule.forFeature([Progress]), UsersModule, GamesModule],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
