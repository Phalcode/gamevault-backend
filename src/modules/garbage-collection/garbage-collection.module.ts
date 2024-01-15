import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Game } from "../games/game.entity";
import { GamevaultUser } from "../users/gamevault-user.entity";
import { ImageGarbageCollectionService } from "./image-garbage-collection.service";
import { ImagesModule } from "../images/images.module";
import { Image } from "../images/image.entity";

@Module({
  imports: [
    ImagesModule,
    TypeOrmModule.forFeature([Image]),
    TypeOrmModule.forFeature([Game]),
    TypeOrmModule.forFeature([GamevaultUser]),
  ],
  controllers: [],
  providers: [ImageGarbageCollectionService],
})
export class GarbageCollectionModule {}
