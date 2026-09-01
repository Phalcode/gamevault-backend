import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import {
  GAMEVAULT_CONFIG,
  getGamevaultConfig,
} from "../../gamevault-config.js";

@Global()
@Module({
  providers: [
    {
      provide: GAMEVAULT_CONFIG,
      inject: [ConfigService],
      useFactory: getGamevaultConfig,
    },
  ],
  exports: [GAMEVAULT_CONFIG],
})
export class GamevaultConfigModule {}
