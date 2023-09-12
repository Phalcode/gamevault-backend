import { Module, forwardRef } from "@nestjs/common";
import { ImagesService } from "./images.service";
import { ImagesController } from "./images.controller";
import { HttpModule } from "@nestjs/axios";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Image } from "./image.entity";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([Image]),
    forwardRef(() => UsersModule),
  ],
  controllers: [ImagesController],
  providers: [ImagesService],
  exports: [ImagesService],
})
export class ImagesModule {}
