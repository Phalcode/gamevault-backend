/*
https://docs.nestjs.com/modules
*/

import { Module } from "@nestjs/common";
import { PluginService } from "./plugin.service";

@Module({
  providers: [PluginService],
  exports: [PluginService],
})
export class PluginModule {}
