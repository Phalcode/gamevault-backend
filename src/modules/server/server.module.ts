import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GamevaultServer } from "./gamevault-server.entity";
import { ServerService } from "./server.service";

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([GamevaultServer])],
  providers: [ServerService],
  exports: [ServerService],
})
export class ServerModule {}
