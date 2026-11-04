import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service.js";

/**
 * Reports errors that never reach the HTTP exception filter: unhandled promise
 * rejections and uncaught exceptions from cron jobs, background tasks and
 * startup code.
 *
 * Only registered when analytics is enabled, because the whole
 * `AnalyticsModule` is absent otherwise.
 */
@Injectable()
export class AnalyticsProcessErrorsService implements OnApplicationBootstrap {
  private registered = false;

  constructor(private readonly analytics: AnalyticsService) {}

  onApplicationBootstrap(): void {
    if (this.registered) return;
    this.registered = true;

    // `uncaughtExceptionMonitor` runs before the default crash handling and
    // does not suppress it, so the process still dies the way it did before.
    process.on("uncaughtExceptionMonitor", (error) => {
      this.analytics.reportError(error, { service: "process" });
    });

    // For rejections, adding a listener would stop Node from crashing on them.
    // Report first, then rethrow so the default behaviour is preserved.
    process.on("unhandledRejection", (reason) => {
      this.analytics.reportError(reason, { service: "process" });
      process.nextTick(() => {
        throw reason instanceof Error ? reason : new Error(String(reason));
      });
    });
  }
}
