import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { GamevaultGame } from "../games/gamevault-game.entity";
import { Media } from "../media/media.entity";
import { MediaModule } from "../media/media.module";
import { GamevaultUser } from "../users/gamevault-user.entity";
import { MediaGarbageCollectionService } from "./media-garbage-collection.service";

@Module({
  imports: [
    MediaModule,
    TypeOrmModule.forFeature([Media]),
    TypeOrmModule.forFeature([GamevaultGame]),
    TypeOrmModule.forFeature([GamevaultUser]),
  ],
  controllers: [],
  providers: [MediaGarbageCollectionService],
  exports: [MediaGarbageCollectionService],
})
export class GarbageCollectionModule {}
