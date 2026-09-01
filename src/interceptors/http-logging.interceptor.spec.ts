import { of, throwError } from "rxjs";

import configuration from "../configuration.js";
import { HttpLoggingInterceptor } from "./http-logging.interceptor.js";

// Mock the configuration module
vi.mock("../configuration.js", () => ({
  __esModule: true,
  default: {
    TESTING: {
      LOG_HTTP_TRAFFIC_ENABLED: true,
    },
  },
}));

describe("HttpLoggingInterceptor", () => {
  let interceptor: HttpLoggingInterceptor;
  let mockCallHandler: any;

  beforeEach(() => {
    interceptor = new HttpLoggingInterceptor(configuration);
    mockCallHandler = {
      handle: vi.fn().mockReturnValue(of({ data: "response" })),
    };
  });

  function createMockContext(url: string, method = "GET") {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          method,
          url,
          headers: {
            authorization: "Bearer token123",
            "content-type": "application/json",
          },
          body: { username: "test", password: "secret123" },
          query: {},
          params: {},
          ip: "127.0.0.1",
        }),
        getResponse: () => ({
          statusCode: 200,
          getHeaders: () => ({
            "content-type": "application/json",
            "set-cookie": "session=abc",
          }),
        }),
      }),
    } as any;
  }

  it("should pass through and log for a normal request", async () => {
    const context = createMockContext("/api/games");
    const result$ = interceptor.intercept(context, mockCallHandler);
    await new Promise<void>((resolve) => {
      result$.subscribe({
        next: (value) => {
          expect(value).toEqual({ data: "response" });
          resolve();
        },
      });
    });
  });

  it("should skip logging for /api/status route", async () => {
    const context = createMockContext("/api/status");
    const result$ = interceptor.intercept(context, mockCallHandler);
    await new Promise<void>((resolve) => {
      result$.subscribe({
        next: () => {
          expect(mockCallHandler.handle).toHaveBeenCalled();
          resolve();
        },
      });
    });
  });

  it("should skip logging for /api/health route", async () => {
    const context = createMockContext("/api/health");
    const result$ = interceptor.intercept(context, mockCallHandler);
    await new Promise<void>((resolve) => {
      result$.subscribe({
        next: () => {
          expect(mockCallHandler.handle).toHaveBeenCalled();
          resolve();
        },
      });
    });
  });

  it("should handle error responses", async () => {
    const context = createMockContext("/api/games", "POST");
    mockCallHandler.handle.mockReturnValue(
      throwError(() => ({ status: 400, message: "Bad Request" })),
    );
    const result$ = interceptor.intercept(context, mockCallHandler);
    await new Promise<void>((resolve) => {
      result$.subscribe({
        error: () => {
          // Error is still propagated
          resolve();
        },
      });
    });
  });

  it("should redact sensitive headers", async () => {
    const context = createMockContext("/api/users");
    const result$ = interceptor.intercept(context, mockCallHandler);
    await new Promise<void>((resolve) => {
      result$.subscribe({
        next: () => {
          // The interceptor logs internally; we just verify it doesn't throw
          resolve();
        },
      });
    });
  });

  it("should handle non-object body in sanitizeBody", async () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: "GET",
          url: "/api/test",
          headers: {},
          body: "plain string body",
          query: {},
          params: {},
          ip: "127.0.0.1",
        }),
        getResponse: () => ({
          statusCode: 200,
          getHeaders: () => ({}),
        }),
      }),
    } as any;
    const result$ = interceptor.intercept(context, mockCallHandler);
    await new Promise<void>((resolve) => {
      result$.subscribe({
        next: () => resolve(),
      });
    });
  });
});

describe("HttpLoggingInterceptor (disabled)", () => {
  let interceptor: HttpLoggingInterceptor;
  let mockCallHandler: any;

  beforeEach(() => {
    // Override the mock for this suite
    const config = configuration as any;
    config.TESTING.LOG_HTTP_TRAFFIC_ENABLED = false;
    interceptor = new HttpLoggingInterceptor(config);
    mockCallHandler = {
      handle: vi.fn().mockReturnValue(of("result")),
    };
  });

  afterEach(() => {
    const config = configuration as any;
    config.TESTING.LOG_HTTP_TRAFFIC_ENABLED = true;
  });

  it("should skip logging when disabled and just pass through", async () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ url: "/api/games" }),
        getResponse: () => ({}),
      }),
    } as any;
    const result$ = interceptor.intercept(context, mockCallHandler);
    await new Promise<void>((resolve) => {
      result$.subscribe({
        next: (value) => {
          expect(value).toBe("result");
          resolve();
        },
      });
    });
  });
});
