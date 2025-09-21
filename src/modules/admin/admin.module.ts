import { Module } from "@nestjs/common";

import { DatabaseModule } from "../database/database.module";
import { DatabaseService } from "../database/database.service";
import { StatusModule } from "../status/status.module";
import { WebUIModule } from "../web-ui/web-ui.module";
import { AdminController } from "./admin.controller";

@Module({
  imports: [StatusModule, DatabaseModule, WebUIModule],
  controllers: [AdminController],
  providers: [DatabaseService],
})
export class AdminModule {}
