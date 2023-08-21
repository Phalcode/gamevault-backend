import { Module } from "@nestjs/common";
import { StoresService } from "./stores.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Store } from "./store.entity";

@Module({
  imports: [TypeOrmModule, TypeOrmModule.forFeature([Store])],
  controllers: [],
  providers: [StoresService],
  exports: [StoresService],
})
export class StoresModule {}
