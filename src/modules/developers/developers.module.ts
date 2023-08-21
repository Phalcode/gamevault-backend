import { Module } from "@nestjs/common";
import { DevelopersService } from "./developers.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Developer } from "./developer.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Developer])],
  controllers: [],
  providers: [DevelopersService],
  exports: [DevelopersService],
})
export class DevelopersModule {}
