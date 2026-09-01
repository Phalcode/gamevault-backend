import { Module } from "@nestjs/common";
import { ConfigController } from "./config.controller.js";

@Module({
  controllers: [ConfigController],
})
export class ConfigModule {}
