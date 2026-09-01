import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { GamesModule } from "../games/games.module.js";
import { MediaModule } from "../media/media.module.js";
import { ActivityGateway } from "./activity.gateway.js";
import { ApiKeyService } from "./api-key.service.js";
import { GamevaultUser } from "./gamevault-user.entity.js";
import { UsersController } from "./users.controller.js";
import { UsersService } from "./users.service.js";

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
