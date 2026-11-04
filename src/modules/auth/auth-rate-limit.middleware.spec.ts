import type { NextFunction, Request, Response } from "express";
import express from "express";
import { EventEmitter } from "node:events";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { AuthRateLimiter } from "./auth-rate-limit.middleware.js";

const PROTECTED_PATH = "/api/auth/basic/login";

interface FakeResponse extends Response {
  headers: Record<string, string>;
  body?: unknown;
  emitFinish(): void;
}

function createResponse(): FakeResponse {
  const emitter = new EventEmitter();
  const headers: Record<string, string> = {};
  const response = {
    headers,
    statusCode: 200 as number,
    body: undefined as unknown,
    setHeader(name: string, value: string) {
      headers[name] = value;
    },
    status(code: number) {
      response.statusCode = code;
      return response;
    },
    json(body: unknown) {
      response.body = body;
      return response;
    },
    on: emitter.on.bind(emitter),
    emitFinish: () => emitter.emit("finish"),
  };
  return response as unknown as FakeResponse;
}

function createRequest(
  options: { path?: string; ip?: string; username?: string } = {},
): Request {
  const {
    path = PROTECTED_PATH,
    ip = "203.0.113.7",
    username = "alice",
  } = options;
  return {
    path,
    ip,
    headers: {
      authorization: `Basic ${Buffer.from(`${username}:wrong-password`).toString("base64")}`,
    },
  } as unknown as Request;
}

function createLimiter(
  options: Partial<{
    enabled: boolean;
    maxAttempts: number;
    windowSeconds: number;
  }> = {},
) {
  return new AuthRateLimiter({
    enabled: options.enabled ?? true,
    maxAttempts: options.maxAttempts ?? 3,
    windowSeconds: options.windowSeconds ?? 300,
  });
}

function attempt(
  limiter: AuthRateLimiter,
  request: Request,
  statusCode: number,
): { next: NextFunction; response: FakeResponse } {
  const response = createResponse();
  const next = vi.fn() as unknown as NextFunction;
  limiter.use(request, response, next);
  if (response.statusCode === 200) {
    response.statusCode = statusCode;
  }
  response.emitFinish();
  return { next, response };
}

describe("AuthRateLimiter", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("lets the configured number of failures through and blocks the next one", () => {
    const limiter = createLimiter({ maxAttempts: 3 });

    for (let index = 0; index < 3; index++) {
      expect(attempt(limiter, createRequest(), 401).next).toHaveBeenCalled();
    }

    const blocked = attempt(limiter, createRequest(), 401);
    expect(blocked.next).not.toHaveBeenCalled();
    expect(blocked.response.statusCode).toBe(429);
    expect(blocked.response.headers["Retry-After"]).toBeDefined();
    expect(blocked.response.body).toEqual(
      expect.objectContaining({
        statusCode: 429,
        error: "Too Many Requests",
        message: expect.stringContaining("Too many failed login attempts"),
      }),
    );
  });

  it("does not count successful logins", () => {
    const limiter = createLimiter({ maxAttempts: 1 });

    expect(attempt(limiter, createRequest(), 200).next).toHaveBeenCalled();
    expect(attempt(limiter, createRequest(), 401).next).toHaveBeenCalled();

    const blocked = attempt(limiter, createRequest(), 401);
    expect(blocked.response.statusCode).toBe(429);
  });

  it("resets the counter after a successful login", () => {
    const limiter = createLimiter({ maxAttempts: 2 });

    attempt(limiter, createRequest(), 401);
    attempt(limiter, createRequest(), 200);
    attempt(limiter, createRequest(), 401);

    expect(attempt(limiter, createRequest(), 401).next).toHaveBeenCalled();
  });

  it("counts per client address and username", () => {
    const limiter = createLimiter({ maxAttempts: 1 });

    attempt(limiter, createRequest({ username: "alice" }), 401);
    expect(
      attempt(limiter, createRequest({ username: "alice" }), 401).response
        .statusCode,
    ).toBe(429);
    expect(
      attempt(limiter, createRequest({ username: "bob" }), 401).next,
    ).toHaveBeenCalled();
    expect(
      attempt(limiter, createRequest({ ip: "198.51.100.9" }), 401).next,
    ).toHaveBeenCalled();
  });

  it("ignores every other route", () => {
    const limiter = createLimiter({ maxAttempts: 0 });

    for (const path of ["/api/auth/refresh", "/api/auth/oauth2/login", "/"]) {
      expect(
        attempt(limiter, createRequest({ path }), 401).next,
      ).toHaveBeenCalled();
    }
  });

  it("is a no-op when disabled", () => {
    const limiter = createLimiter({ enabled: false, maxAttempts: 0 });

    expect(attempt(limiter, createRequest(), 401).next).toHaveBeenCalled();
  });

  it("allows attempts again once the window expired", () => {
    vi.useFakeTimers();
    const limiter = createLimiter({ maxAttempts: 1, windowSeconds: 60 });

    attempt(limiter, createRequest(), 401);
    expect(attempt(limiter, createRequest(), 401).response.statusCode).toBe(
      429,
    );

    vi.advanceTimersByTime(61_000);
    expect(attempt(limiter, createRequest(), 401).next).toHaveBeenCalled();
  });

  it("matches the protected route when mounted in a real express app", async () => {
    const limiter = createLimiter({ maxAttempts: 2 });
    const app = express();
    app.use(limiter.use);
    app.get(PROTECTED_PATH, (_request, response) => {
      response.status(401).json({
        message: "Authentication Failed: Incorrect username or password",
        error: "Unauthorized",
        statusCode: 401,
      });
    });
    app.get("/api/status", (_request, response) => {
      response.json({ ok: true });
    });

    const server = createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });
    const { port } = server.address() as AddressInfo;
    const loginUrl = `http://127.0.0.1:${port}${PROTECTED_PATH}`;

    try {
      expect((await fetch(loginUrl)).status).toBe(401);
      expect((await fetch(loginUrl)).status).toBe(401);

      const blocked = await fetch(loginUrl);
      expect(blocked.status).toBe(429);
      expect(blocked.headers.get("retry-after")).toBeTruthy();
      expect(await blocked.json()).toEqual(
        expect.objectContaining({ statusCode: 429 }),
      );

      // Unrelated routes are never throttled.
      expect((await fetch(`http://127.0.0.1:${port}/api/status`)).status).toBe(
        200,
      );
    } finally {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });
});
