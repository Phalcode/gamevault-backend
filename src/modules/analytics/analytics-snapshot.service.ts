import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { existsSync } from "node:fs";
import { Repository } from "typeorm";
import type { AppConfiguration } from "../../configuration.js";
import { InjectGamevaultConfig } from "../../decorators/inject-gamevault-config.decorator.js";
import { GameVersion } from "../games/game-version.entity.js";
import { GamevaultGame } from "../games/gamevault-game.entity.js";
import { GamevaultUser } from "../users/gamevault-user.entity.js";
import { AnalyticsService } from "./analytics.service.js";

/**
 * Installation-level reports: one at startup and a light snapshot every six
 * hours. Everything is bucketed so a single value cannot be traced back to a
 * library, a user or a game.
 */
@Injectable()
export class AnalyticsSnapshotService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AnalyticsSnapshotService.name);
  private readonly startedAt = Date.now();

  constructor(
    private readonly analytics: AnalyticsService,
    @InjectGamevaultConfig() private readonly config: AppConfiguration,
    @InjectRepository(GamevaultGame)
    private readonly games: Repository<GamevaultGame>,
    @InjectRepository(GameVersion)
    private readonly versions: Repository<GameVersion>,
    @InjectRepository(GamevaultUser)
    private readonly users: Repository<GamevaultUser>,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.analytics.enabled) return;
    this.analytics.emit("server_started", {
      ...this.featureFlags(),
      db_system: this.config.DB.SYSTEM,
      node_major: process.versions.node.split(".")[0],
      platform: process.platform,
      arch: process.arch,
      docker: process.env.DOCKER === "true" || existsSync("/.dockerenv"),
    });
  }

  @Cron("0 */6 * * *")
  async snapshot(): Promise<void> {
    if (!this.analytics.enabled) return;

    try {
      const [games, versions, users] = await Promise.all([
        this.games.count(),
        this.versions.count(),
        this.users.count(),
      ]);

      this.analytics.emit("server_snapshot", {
        ...this.featureFlags(),
        games: bucket(games),
        versions: bucket(versions),
        users: bucket(users),
        uptime_hours: bucket(
          Math.round((Date.now() - this.startedAt) / 3_600_000),
        ),
      });
    } catch (error) {
      this.logger.debug(
        `Analytics snapshot failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /** Which optional features this server runs, so defaults can be judged. */
  private featureFlags(): Record<string, string | number | boolean> {
    return {
      web_ui: this.config.WEB_UI.ENABLED,
      savefiles: this.config.SAVEFILES.ENABLED,
      parental: this.config.PARENTAL.AGE_RESTRICTION_ENABLED,
      demo_mode: this.config.SERVER.DEMO_MODE_ENABLED,
      sso: this.config.AUTH.OAUTH2.ENABLED,
      api_keys: this.config.AUTH.API_KEY.ENABLED,
      registration_disabled: this.config.SERVER.REGISTRATION_DISABLED,
    };
  }
}

/**
 * Coarse buckets: exact counts would fingerprint a specific library.
 */
function bucket(value: number): string {
  if (value <= 0) return "0";
  if (value < 10) return "1_9";
  if (value < 100) return "10_99";
  if (value < 1000) return "100_999";
  if (value < 10000) return "1k_10k";
  return "gt_10k";
}
