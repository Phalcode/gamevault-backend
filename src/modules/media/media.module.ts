import { HttpModule } from "@nestjs/axios";
import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UsersModule } from "../users/users.module";
import { MediaController } from "./media.controller";
import { Media } from "./media.entity";
import { MediaService } from "./media.service";

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([Media]),
    forwardRef(() => UsersModule),
  ],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
