import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";

@Module({
  imports: [],
  controllers: [HealthController],
  providers: [],
  exports: [],
})
export class HealthModule {}
