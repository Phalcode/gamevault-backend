import { Module } from "@nestjs/common";

import { StatusController } from "./status.controller.js";
import { StatusService } from "./status.service.js";

@Module({
  imports: [],
  controllers: [StatusController],
  providers: [StatusService],
  exports: [StatusService],
})
export class StatusModule {}
