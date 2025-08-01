import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { GamesModule } from "../games/games.module";
import { MediaModule } from "../media/media.module";
import { ActivityGateway } from "./activity.gateway";
import { ApiKeyService } from "./api-key.service";
import { GamevaultUser } from "./gamevault-user.entity";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([GamevaultUser]),
    forwardRef(() => MediaModule),
    forwardRef(() => GamesModule),
  ],
  controllers: [UsersController],
  providers: [UsersService, ApiKeyService, ActivityGateway],
  exports: [UsersService, ApiKeyService],
})
export class UsersModule {}
