import { HealthService } from "./health.service";
import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
@Module({
  imports: [],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
