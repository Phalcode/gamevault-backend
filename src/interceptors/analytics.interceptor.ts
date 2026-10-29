import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { AnalyticsService } from "../modules/analytics/analytics.service.js";

/** Routes that must never show up in usage statistics. */
const EXCLUDED_ROUTES = new Set(["", "/", "/status", "/health", "/metrics"]);

/**
 * Aggregates HTTP traffic per route template and status class.
 *
 * The route template (`request.route.path`) is used instead of the raw URL so
 * ids do not end up in the counters. Everything is aggregated in memory by
 * `AnalyticsService` and flushed as one event per bucket, so a busy server does
 * not send one event per request. Errors are reported separately so broken
 * installations are visible without storing message bodies.
 */
@Injectable()
export class AnalyticsInterceptor implements NestInterceptor {
  constructor(private readonly analytics: AnalyticsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") return next.handle();

    const request = context.switchToHttp().getRequest<{
      method?: string;
      route?: { path?: string };
      url?: string;
      user?: { role?: string };
    }>();
    const route = request.route?.path ?? "";
    if (EXCLUDED_ROUTES.has(route)) return next.handle();

    const startedAt = Date.now();
    return next.handle().pipe(
      tap({
        next: () => this.record(context, request, route, startedAt, false),
        error: () => this.record(context, request, route, startedAt, true),
      }),
    );
  }

  private record(
    context: ExecutionContext,
    request: { method?: string; user?: { role?: string } },
    route: string,
    startedAt: number,
    failed: boolean,
  ): void {
    const status: number =
      context.switchToHttp().getResponse<{ statusCode?: number }>()
        .statusCode ?? (failed ? 500 : 200);
    const meta = {
      route,
      method: request.method ?? "GET",
      status_class: `${Math.floor(status / 100)}xx`,
      role: request.user?.role ?? "anonymous",
    };

    this.analytics.count("api_request", meta);

    if (status === 401 || status === 403) {
      this.analytics.count("unauthorized_request", meta);
    }
    if (status === 429) {
      this.analytics.count("api_rate_limited", meta);
    }
    if (status >= 500) {
      this.analytics.emit("server_error", {
        ...meta,
        service: context.getClass().name,
        duration_ms: bucketDuration(Date.now() - startedAt),
      });
    }
  }
}

function bucketDuration(milliseconds: number): string {
  if (milliseconds < 100) return "lt_100ms";
  if (milliseconds < 500) return "100ms_500ms";
  if (milliseconds < 2_000) return "500ms_2s";
  if (milliseconds < 10_000) return "2s_10s";
  return "gt_10s";
}
