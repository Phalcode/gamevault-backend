import { HealthService } from "./health.service";
import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [UsersModule],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [],
})
export class HealthModule {}
