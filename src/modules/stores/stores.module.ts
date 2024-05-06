import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Store } from "./store.entity";
import { StoresService } from "./stores.service";

@Module({
  imports: [TypeOrmModule, TypeOrmModule.forFeature([Store])],
  controllers: [],
  providers: [StoresService],
  exports: [StoresService],
})
export class StoresModule {}
