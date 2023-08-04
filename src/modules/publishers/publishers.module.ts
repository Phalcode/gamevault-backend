import { Module } from "@nestjs/common";
import { PublishersService } from "./publishers.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Publisher } from "./publisher.entity";

@Module({
  imports: [TypeOrmModule, TypeOrmModule.forFeature([Publisher])],
  controllers: [],
  providers: [PublishersService],
  exports: [PublishersService],
})
export class PublishersModule {}
