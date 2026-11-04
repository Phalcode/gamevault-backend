import type { NextFunction, Request, Response } from "express";

/** Route the limiter guards. Only password logins, nothing else. */
const PROTECTED_PATH = "/api/auth/basic/login";
/** Status codes that count as a failed login attempt. */
const FAILURE_STATUS_CODES = new Set([401, 403, 406]);

interface AttemptRecord {
  count: number;
  windowStartedAt: number;
}

export interface AuthRateLimiterOptions {
  enabled: boolean;
  maxAttempts: number;
  windowSeconds: number;
}

/**
 * Limits repeated *failed* password logins per client and username.
 *
 * Successful logins are never counted or blocked, and only the basic login
 * route is affected, so refresh calls and SSO round trips can not be throttled
 * by accident. The state is in-memory and therefore per process.
 */
export class AuthRateLimiter {
  private readonly attempts = new Map<string, AttemptRecord>();
  private lastSweep = Date.now();

  constructor(private readonly options: AuthRateLimiterOptions) {}

  readonly use = (req: Request, res: Response, next: NextFunction): void => {
    if (!this.options.enabled || req.path !== PROTECTED_PATH) {
      next();
      return;
    }

    this.sweepIfNeeded();

    const key = this.buildKey(req);
    const now = Date.now();
    const windowMs = this.options.windowSeconds * 1000;
    const record = this.attempts.get(key);

    if (record && now - record.windowStartedAt >= windowMs) {
      this.attempts.delete(key);
    }

    const current = this.attempts.get(key);
    if (current && current.count >= this.options.maxAttempts) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((current.windowStartedAt + windowMs - now) / 1000),
      );
      res.setHeader("Retry-After", String(retryAfterSeconds));
      res.status(429).json({
        message: `Authentication Failed: Too many failed login attempts. Try again in ${retryAfterSeconds} seconds.`,
        error: "Too Many Requests",
        statusCode: 429,
      });
      res.on("finish", () => this.recordFailure(key));
      return;
    }

    res.on("finish", () => {
      if (FAILURE_STATUS_CODES.has(res.statusCode)) {
        this.recordFailure(key);
      } else if (res.statusCode >= 200 && res.statusCode < 300) {
        this.attempts.delete(key);
      }
    });

    next();
  };

  private recordFailure(key: string): void {
    const now = Date.now();
    const windowMs = this.options.windowSeconds * 1000;
    const record = this.attempts.get(key);

    if (!record || now - record.windowStartedAt >= windowMs) {
      this.attempts.set(key, { count: 1, windowStartedAt: now });
      return;
    }
    record.count += 1;
  }

  private buildKey(req: Request): string {
    return `${req.ip ?? "unknown"}|${extractUsername(req)}`;
  }

  /** Drops expired records so the map cannot grow without bound. */
  private sweepIfNeeded(): void {
    const now = Date.now();
    if (now - this.lastSweep < 60_000) return;
    this.lastSweep = now;

    const windowMs = this.options.windowSeconds * 1000;
    for (const [key, record] of this.attempts) {
      if (now - record.windowStartedAt >= windowMs) {
        this.attempts.delete(key);
      }
    }
  }
}

/** Username of a `Basic` authorization header, lowercased for stable keys. */
function extractUsername(req: Request): string {
  const header = req.headers.authorization;
  if (!header?.startsWith("Basic ")) return "";
  try {
    const decoded = Buffer.from(
      header.slice("Basic ".length),
      "base64",
    ).toString("utf8");
    return (decoded.split(":")[0] ?? "").toLowerCase();
  } catch {
    return "";
  }
}
