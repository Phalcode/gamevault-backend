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

/** Swetrix sends a heartbeat every 28s while a session is open. */
const HEARTBEAT_INTERVAL_MS = 28_000;
/** How often aggregated request counters are sent. */
const FLUSH_INTERVAL_MS = 60_000;

/**
 * Anonymous usage reports for the GameVault Server.
 *
 * Shapes:
 * - {@link emit} sends a single event for a rare action (a registration, a
 *   download, a migration).
 * - {@link count} aggregates frequent actions (HTTP requests per route) and
 *   flushes one event per bucket with a `count` field.
 * - A pageview on `/` opens a session at startup and the heartbeat keeps it
 *   alive, exactly like the desktop client does, so server uptime shows up in
 *   the same dashboards.
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
  private heartbeatTimer: NodeJS.Timeout | null = null;
  /** True once the session pageview was accepted by the collector. */
  private sessionOpen = false;

  constructor(
    @InjectGamevaultConfig() private readonly config: AppConfiguration,
    private readonly serverService: ServerService,
  ) {}

  get enabled(): boolean {
    return this.config.ANALYTICS.ENABLED;
  }

  onModuleInit(): void {
    if (!this.enabled) return;
    this.flushTimer = setInterval(() => void this.flush(), FLUSH_INTERVAL_MS);
    // Do not keep the process alive just for analytics.
    this.flushTimer.unref?.();

    // A pageview on "/" opens the session; the heartbeat continues it.
    void this.openSession();
    this.heartbeatTimer = setInterval(
      () => void this.heartbeat(),
      HEARTBEAT_INTERVAL_MS,
    );
    this.heartbeatTimer.unref?.();
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
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

  /**
   * Opens the analytics session with a pageview on `/`, like the client SDK's
   * `trackViews()` does on mount. Retried by {@link heartbeat} until accepted.
   */
  private async openSession(): Promise<void> {
    const { locale, timeZone } = resolvedLocale();
    const ok = await this.post(this.baseEndpoint(), {
      pid: this.config.ANALYTICS.PROJECT_ID,
      pg: "/",
      lc: locale,
      tz: timeZone,
      unique: false,
      profileId: this.serverService.getServerUuid(),
    });
    this.sessionOpen = ok;
  }

  /** Keeps the session alive. Restores it if the pageview never landed. */
  private async heartbeat(): Promise<void> {
    if (!this.sessionOpen) {
      await this.openSession();
      return;
    }
    const ok = await this.post(`${this.baseEndpoint()}/hb`, {
      pid: this.config.ANALYTICS.PROJECT_ID,
      profileId: this.serverService.getServerUuid(),
    });
    if (!ok) this.sessionOpen = false;
  }

  private baseEndpoint(): string {
    return this.config.ANALYTICS.ENDPOINT.replace(/\/+$/, "");
  }

  private async send(event: string, meta: AnalyticsMeta): Promise<void> {
    await this.post(`${this.baseEndpoint()}/custom`, {
      pid: this.config.ANALYTICS.PROJECT_ID,
      ev: event,
      meta: { ...meta, server_version: this.config.SERVER.VERSION },
      profileId: this.serverService.getServerUuid(),
    });
  }

  /** Fire-and-forget POST. Returns whether the collector accepted it. */
  private async post(path: string, body: unknown): Promise<boolean> {
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": `GameVault/${this.config.SERVER.VERSION}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5_000),
      });
      if (!response.ok) {
        this.logger.debug(
          `Analytics request to ${path} was rejected (${response.status}).`,
        );
      }
      return response.ok;
    } catch (error) {
      // Analytics must never surface as an application error.
      this.logger.debug(
        `Analytics request to ${path} failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }
}

/**
 * Locale and timezone of the server process, in the format the collector
 * expects (IETF tag and IANA timezone).
 */
function resolvedLocale(): { locale: string; timeZone: string } {
  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions();
    return { locale: resolved.locale, timeZone: resolved.timeZone };
  } catch {
    return { locale: "en-US", timeZone: "UTC" };
  }
}

/**
 * Coarse buckets for counts: an exact number would fingerprint a specific
 * library or user base.
 */
export function countBucket(value: number): string {
  if (value <= 0) return "0";
  if (value < 10) return "1_9";
  if (value < 100) return "10_99";
  if (value < 1000) return "100_999";
  if (value < 10000) return "1k_10k";
  return "gt_10k";
}
