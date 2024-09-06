import { Module } from "@nestjs/common";
import { ConfigController } from "./admin.controller";

@Module({
  controllers: [ConfigController],
})
export class ConfigModule {}
