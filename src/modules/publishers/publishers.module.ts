import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Publisher } from "./publisher.entity";
import { PublishersService } from "./publishers.service";

@Module({
  imports: [TypeOrmModule, TypeOrmModule.forFeature([Publisher])],
  controllers: [],
  providers: [PublishersService],
  exports: [PublishersService],
})
export class PublishersModule {}
