import { ActivityGateway } from "./activity.gateway.js";
import { ActivityState } from "./models/activity-state.enum.js";

vi.mock("../../configuration.js", () => ({
  __esModule: true,
  default: {
    SERVER: { ONLINE_ACTIVITIES_DISABLED: false },
  },
}));

vi.mock("../../logging.js", () => ({
  __esModule: true,
  default: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
  logGamevaultGame: vi.fn(),
  logGamevaultUser: vi.fn(),
  logMedia: vi.fn(),
  logMetadata: vi.fn(),
  logMetadataProvider: vi.fn(),
  logProgress: vi.fn(),
}));

describe("ActivityGateway", () => {
  let gateway: ActivityGateway;
  let mockUsersService: any;

  beforeEach(() => {
    mockUsersService = {
      findOneByUserIdOrFail: vi
        .fn()
        .mockImplementation((id) =>
          Promise.resolve({ id, username: `user${id}` }),
        ),
    };

    gateway = new ActivityGateway(mockUsersService);
    gateway.server = { emit: vi.fn() } as any;
  });

  afterEach(() => vi.restoreAllMocks());

  // ─── handleConnection ──────────────────────────────────────────────

  describe("handleConnection", () => {
    it("should emit current activities to connected client", () => {
      const client = { id: "socket-1", emit: vi.fn() } as any;
      gateway.handleConnection(client);
      expect(client.emit).toHaveBeenCalledWith("activities", []);
    });

    it("should include existing activities when a new client connects", async () => {
      // Set up an existing activity
      const existingClient = { id: "socket-0" } as any;
      (existingClient as any).user = { id: 1 };
      await gateway.setActivity(existingClient, {
        state: ActivityState.ONLINE,
      } as any);

      const newClient = { id: "socket-1", emit: vi.fn() } as any;
      gateway.handleConnection(newClient);
      expect(newClient.emit).toHaveBeenCalledWith(
        "activities",
        expect.arrayContaining([
          expect.objectContaining({ user_id: 1, state: ActivityState.ONLINE }),
        ]),
      );
    });
  });

  // ─── handleDisconnect ──────────────────────────────────────────────

  describe("handleDisconnect", () => {
    it("should remove activities for the disconnected client", async () => {
      const client = { id: "socket-1" } as any;
      (client as any).user = { id: 42 };
      await gateway.setActivity(client, {
        state: ActivityState.PLAYING,
        game_id: 10,
      } as any);

      gateway.handleDisconnect(client);

      // Activities should be empty after disconnect
      const newClient = { id: "socket-2", emit: vi.fn() } as any;
      gateway.handleConnection(newClient);
      expect(newClient.emit).toHaveBeenCalledWith("activities", []);
    });

    it("should only remove activities matching the disconnected socket", async () => {
      const client1 = { id: "socket-1" } as any;
      (client1 as any).user = { id: 1 };
      await gateway.setActivity(client1, {
        state: ActivityState.ONLINE,
      } as any);

      const client2 = { id: "socket-2" } as any;
      (client2 as any).user = { id: 2 };
      await gateway.setActivity(client2, {
        state: ActivityState.ONLINE,
      } as any);

      gateway.handleDisconnect(client1);

      const checkClient = { id: "socket-3", emit: vi.fn() } as any;
      gateway.handleConnection(checkClient);
      const activities = checkClient.emit.mock.calls[0][1];
      expect(activities).toHaveLength(1);
      expect(activities[0].user_id).toBe(2);
    });
  });

  // ─── setActivity ──────────────────────────────────────────────────

  describe("setActivity", () => {
    it("should set activity and broadcast to all clients", async () => {
      const client = { id: "socket-1" } as any;
      (client as any).user = { id: 5 };

      await gateway.setActivity(client, {
        state: ActivityState.ONLINE,
      } as any);

      expect(gateway.server.emit).toHaveBeenCalledWith(
        "activity",
        expect.objectContaining({
          user_id: 5,
          socket_id: "socket-1",
          state: ActivityState.ONLINE,
        }),
      );
    });

    it("should include game_id only for PLAYING state", async () => {
      const client = { id: "socket-1" } as any;
      (client as any).user = { id: 5 };

      await gateway.setActivity(client, {
        state: ActivityState.PLAYING,
        game_id: 42,
      } as any);

      expect(gateway.server.emit).toHaveBeenCalledWith(
        "activity",
        expect.objectContaining({
          state: ActivityState.PLAYING,
          game_id: 42,
        }),
      );
    });

    it("should clear game_id for non-PLAYING states", async () => {
      const client = { id: "socket-1" } as any;
      (client as any).user = { id: 5 };

      await gateway.setActivity(client, {
        state: ActivityState.BUSY,
        game_id: 42,
      } as any);

      expect(gateway.server.emit).toHaveBeenCalledWith(
        "activity",
        expect.objectContaining({
          state: ActivityState.BUSY,
          game_id: undefined,
        }),
      );
    });

    it("should overwrite activity for the same user", async () => {
      const client = { id: "socket-1" } as any;
      (client as any).user = { id: 5 };

      await gateway.setActivity(client, {
        state: ActivityState.ONLINE,
      } as any);

      await gateway.setActivity(client, {
        state: ActivityState.BUSY,
      } as any);

      const checkClient = { id: "socket-2", emit: vi.fn() } as any;
      gateway.handleConnection(checkClient);
      const activities = checkClient.emit.mock.calls[0][1];
      expect(activities).toHaveLength(1);
      expect(activities[0].state).toBe(ActivityState.BUSY);
    });
  });

  // ─── getActivities ────────────────────────────────────────────────

  describe("getActivities", () => {
    it("should emit all activities to the requesting client", async () => {
      const client1 = { id: "socket-1" } as any;
      (client1 as any).user = { id: 1 };
      await gateway.setActivity(client1, {
        state: ActivityState.ONLINE,
      } as any);

      const requestClient = { id: "socket-2", emit: vi.fn() } as any;
      gateway.getActivities(requestClient);
      expect(requestClient.emit).toHaveBeenCalledWith(
        "activities",
        expect.arrayContaining([expect.objectContaining({ user_id: 1 })]),
      );
    });
  });
});
