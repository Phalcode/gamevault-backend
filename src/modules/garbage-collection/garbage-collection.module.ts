import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Game } from "../games/game.entity";
import { Image } from "../images/image.entity";
import { ImagesModule } from "../images/images.module";
import { GamevaultUser } from "../users/gamevault-user.entity";
import { ImageGarbageCollectionService } from "./image-garbage-collection.service";

@Module({
  imports: [
    ImagesModule,
    TypeOrmModule.forFeature([Image]),
    TypeOrmModule.forFeature([Game]),
    TypeOrmModule.forFeature([GamevaultUser]),
  ],
  controllers: [],
  providers: [ImageGarbageCollectionService],
  exports: [ImageGarbageCollectionService],
})
export class GarbageCollectionModule {}
