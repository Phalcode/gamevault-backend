import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GameVersion } from "../games/game-version.entity.js";
import { GamevaultGame } from "../games/gamevault-game.entity.js";
import { ServerModule } from "../server/server.module.js";
import { GamevaultUser } from "../users/gamevault-user.entity.js";
import { AnalyticsProcessErrorsService } from "./analytics-process-errors.service.js";
import { AnalyticsSnapshotService } from "./analytics-snapshot.service.js";
import { AnalyticsService } from "./analytics.service.js";

/**
 * Anonymous usage reports for the GameVault Server.
 *
 * Imported conditionally in `app.module.ts` based on `ANALYTICS_ENABLED`, so
 * everything registered here disappears completely when the operator opted out.
 * No user data leaves the server: counts are bucketed and the only identifier
 * is the server uuid, which `/api/status` already exposes.
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([GamevaultGame, GameVersion, GamevaultUser]),
    ServerModule,
  ],
  providers: [
    AnalyticsService,
    AnalyticsSnapshotService,
    AnalyticsProcessErrorsService,
  ],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
