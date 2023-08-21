import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GamevaultUser } from "./gamevault-user.entity";
import { ImagesModule } from "../images/images.module";

@Module({
  imports: [TypeOrmModule.forFeature([GamevaultUser]), ImagesModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
