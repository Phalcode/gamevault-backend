import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnalyticsService } from "./analytics.service.js";

function createService(enabled = true) {
  const config = {
    ANALYTICS: {
      ENABLED: enabled,
      PROJECT_ID: "test-pid",
      ENDPOINT: "https://analytics.test/log",
    },
    SERVER: { VERSION: "9.9.9" },
  } as any;
  const server = { getServerUuid: () => "server-uuid" } as any;
  return new AnalyticsService(config, server);
}

describe("AnalyticsService", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(() =>
      Promise.resolve(new Response("{}", { status: 200 })),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sends nothing when analytics is disabled", async () => {
    const service = createService(false);
    service.emit("server_started", { db: "SQLITE" });
    service.count("api_request", { route: "/api/games" });
    await service.flush();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts a single event with pid, metadata and the server uuid", async () => {
    const service = createService();
    service.emit("user_registered", { role: "USER" });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const [url, init] = fetchMock.mock.calls[0] as [
      string,
      { body: string; method: string },
    ];
    expect(url).toBe("https://analytics.test/log/custom");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      pid: "test-pid",
      ev: "user_registered",
      profileId: "server-uuid",
      meta: { role: "USER", server_version: "9.9.9" },
    });
  });

  it("aggregates counted events into one event per bucket", async () => {
    const service = createService();
    service.count("api_request", { route: "/api/games", method: "GET" });
    service.count("api_request", { route: "/api/games", method: "GET" });
    service.count("api_request", { route: "/api/users", method: "GET" });
    await service.flush();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const counts = fetchMock.mock.calls.map(([, init]: any) =>
      JSON.parse(init.body),
    );
    const games = counts.find(
      (entry: any) => entry.meta.route === "/api/games",
    );
    expect(games.meta.count).toBe(2);
  });

  it("clears the counters after a flush", async () => {
    const service = createService();
    service.count("api_request", { route: "/api/games" });
    await service.flush();
    await service.flush();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("swallows transport errors", async () => {
    fetchMock.mockImplementation(() => Promise.reject(new Error("offline")));
    const service = createService();
    expect(() => service.emit("server_started", {})).not.toThrow();
    await expect(service.flush()).resolves.toBeUndefined();
  });

  it("opens a session with a pageview on / at startup", async () => {
    const service = createService();
    service.onModuleInit();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const [url, init] = fetchMock.mock.calls[0] as [
      string,
      { body: string; method: string },
    ];
    expect(url).toBe("https://analytics.test/log");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toMatchObject({
      pid: "test-pid",
      pg: "/",
      unique: false,
      profileId: "server-uuid",
    });
    await service.onApplicationShutdown();
  });

  it("sends heartbeats to /hb once the session is open", async () => {
    const service = createService();
    service.onModuleInit();
    await vi.waitFor(() => expect((service as any).sessionOpen).toBe(true));

    await (service as any).heartbeat();

    const [url, init] = fetchMock.mock.calls[1] as [string, { body: string }];
    expect(url).toBe("https://analytics.test/log/hb");
    expect(JSON.parse(init.body)).toMatchObject({
      pid: "test-pid",
      profileId: "server-uuid",
    });
    await service.onApplicationShutdown();
  });

  it("reopens the session when the collector rejects the pageview", async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(new Response("{}", { status: 500 })),
    );
    const service = createService();
    service.onModuleInit();
    await vi.waitFor(() => expect((service as any).sessionOpen).toBe(false));

    // Not open yet, so the next tick retries the pageview instead of /hb.
    await (service as any).heartbeat();
    expect(fetchMock.mock.calls[1][0]).toBe("https://analytics.test/log");
    await service.onApplicationShutdown();
  });
});
