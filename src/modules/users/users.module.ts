import { Module, forwardRef } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GamevaultUser } from "./gamevault-user.entity";
import { ImagesModule } from "../images/images.module";
import { ActivityGateway } from "./activity.gateway";

@Module({
  imports: [
    TypeOrmModule.forFeature([GamevaultUser]),
    forwardRef(() => ImagesModule),
  ],
  controllers: [UsersController],
  providers: [UsersService, ActivityGateway],
  exports: [UsersService],
})
export class UsersModule {}
