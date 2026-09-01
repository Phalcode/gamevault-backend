import { Module } from "@nestjs/common";

import { DatabaseModule } from "../database/database.module.js";
import { DatabaseService } from "../database/database.service.js";
import { StatusModule } from "../status/status.module.js";
import { WebUIModule } from "../web-ui/web-ui.module.js";
import { AdminController } from "./admin.controller.js";

@Module({
  imports: [StatusModule, DatabaseModule, WebUIModule],
  controllers: [AdminController],
  providers: [DatabaseService],
})
export class AdminModule {}
