import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GamevaultServer } from "./gamevault-server.entity.js";
import { ServerService } from "./server.service.js";

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([GamevaultServer])],
  providers: [ServerService],
  exports: [ServerService],
})
export class ServerModule {}
