import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UsersModule } from "../users/users.module.js";
import { MediaController } from "./media.controller.js";
import { Media } from "./media.entity.js";
import { MediaService } from "./media.service.js";

@Module({
  imports: [TypeOrmModule.forFeature([Media]), forwardRef(() => UsersModule)],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
