import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from "@nestjs/common";
import type { AppConfiguration } from "../../configuration.js";
import { InjectGamevaultConfig } from "../../decorators/inject-gamevault-config.decorator.js";
import { ServerService } from "../server/server.service.js";

/** Primitive metadata only, the analytics API rejects nested objects. */
export type AnalyticsMeta = Record<string, string | number | boolean>;

interface PendingCounter {
  event: string;
  meta: AnalyticsMeta;
  count: number;
}

/**
 * Anonymous usage reports for the GameVault Server.
 *
 * Two shapes:
 * - {@link emit} sends a single event for a rare action (a registration, a
 *   download, a migration).
 * - {@link count} aggregates frequent actions (HTTP requests per route) and
 *   flushes one event per bucket with a `count` field.
 *
 * Requests are fire-and-forget with a short timeout: analytics must never
 * delay or break a request. No user id, name, email, IP, game title or file
 * path is ever sent; the only identifier is the server uuid, which is already
 * public through `/api/status`.
 */
@Injectable()
export class AnalyticsService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly counters = new Map<string, PendingCounter>();
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(
    @InjectGamevaultConfig() private readonly config: AppConfiguration,
    private readonly serverService: ServerService,
  ) {}

  get enabled(): boolean {
    return this.config.ANALYTICS.ENABLED;
  }

  onModuleInit(): void {
    if (!this.enabled) return;
    const seconds = Math.max(
      10,
      this.config.ANALYTICS.FLUSH_INTERVAL_SECONDS ?? 60,
    );
    this.flushTimer = setInterval(() => void this.flush(), seconds * 1000);
    // Do not keep the process alive just for analytics.
    this.flushTimer.unref?.();
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
  }

  /** Sends a single event. Never throws. */
  emit(event: string, meta: AnalyticsMeta = {}): void {
    if (!this.enabled) return;
    void this.send(event, meta);
  }

  /**
   * Counts a frequent action. The aggregated event is sent on the next flush
   * with the call count in `meta.count`.
   */
  count(event: string, meta: AnalyticsMeta = {}, by = 1): void {
    if (!this.enabled) return;
    const key = `${event}|${JSON.stringify(meta)}`;
    const existing = this.counters.get(key);
    if (existing) {
      existing.count += by;
      return;
    }
    this.counters.set(key, { event, meta, count: by });
  }

  /** Sends all aggregated counters. Called by the timer and on shutdown. */
  async flush(): Promise<void> {
    const pending = [...this.counters.values()];
    this.counters.clear();
    for (const counter of pending) {
      await this.send(counter.event, {
        ...counter.meta,
        count: counter.count,
      });
    }
  }

  private async send(event: string, meta: AnalyticsMeta): Promise<void> {
    try {
      const response = await fetch(
        `${this.config.ANALYTICS.ENDPOINT.replace(/\/+$/, "")}/custom`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "User-Agent": `GameVault/${this.config.SERVER.VERSION}`,
          },
          body: JSON.stringify({
            pid: this.config.ANALYTICS.PROJECT_ID,
            ev: event,
            meta: { ...meta, server_version: this.config.SERVER.VERSION },
            profileId: this.serverService.getServerUuid(),
          }),
          signal: AbortSignal.timeout(5_000),
        },
      );
      if (!response.ok) {
        this.logger.debug(
          `Analytics event ${event} was rejected (${response.status}).`,
        );
      }
    } catch (error) {
      // Analytics must never surface as an application error.
      this.logger.debug(
        `Analytics event ${event} could not be sent: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
