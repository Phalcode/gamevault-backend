import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Media } from "../media/media.entity";
import { MediaModule } from "../media/media.module";
import { GameMetadata } from "../metadata/games/game.metadata.entity";
import { GamevaultUser } from "../users/gamevault-user.entity";
import { MediaGarbageCollectionService } from "./media-garbage-collection.service";

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
