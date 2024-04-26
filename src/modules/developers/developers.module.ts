import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Developer } from "./developer.entity";
import { DevelopersService } from "./developers.service";

@Module({
  imports: [TypeOrmModule.forFeature([Developer])],
  controllers: [],
  providers: [DevelopersService],
  exports: [DevelopersService],
})
export class DevelopersModule {}
