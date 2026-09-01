import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Media } from "../media/media.entity.js";
import { MediaModule } from "../media/media.module.js";
import { GameMetadata } from "../metadata/games/game.metadata.entity.js";
import { GamevaultUser } from "../users/gamevault-user.entity.js";
import { MediaGarbageCollectionService } from "./media-garbage-collection.service.js";

@Module({
  imports: [
    MediaModule,
    TypeOrmModule.forFeature([Media]),
    TypeOrmModule.forFeature([GameMetadata]),
    TypeOrmModule.forFeature([GamevaultUser]),
  ],
  controllers: [],
  providers: [MediaGarbageCollectionService],
  exports: [MediaGarbageCollectionService],
})
export class GarbageCollectionModule {}
