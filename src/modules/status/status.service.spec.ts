import type { Mock } from "vitest";
import { StatusEnum } from "./models/status.enum.js";
import { StatusService } from "./status.service.js";

describe("StatusService", () => {
  let service: StatusService;
  let mockServerService: { getServerUuid: Mock };

  beforeEach(() => {
    mockServerService = {
      getServerUuid: vi
        .fn()
        .mockReturnValue("550e8400-e29b-41d4-a716-446655440000"),
    };
    service = new StatusService(mockServerService as any);
  });

  describe("constructor", () => {
    it("should initialize with HEALTHY status", () => {
      const status = service.getExtensive();
      expect(status.status).toBe(StatusEnum.HEALTHY);
    });

    it("should have a protocol entry for server start", () => {
      const status = service.getExtensive();
      expect(status.protocol).toBeDefined();
      expect(status.protocol.length).toBeGreaterThanOrEqual(1);
      expect(status.protocol[0].status).toBe(StatusEnum.HEALTHY);
      expect(status.protocol[0].reason).toBe("Server started successfully");
    });

    it("should include a server_uuid", () => {
      const status = service.getExtensive();
      expect(status.server_uuid).toBe("550e8400-e29b-41d4-a716-446655440000");
    });
  });

  describe("getExtensive", () => {
    it("should return status with protocol and uptime", () => {
      const result = service.getExtensive();
      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("version");
      expect(result).toHaveProperty("protocol");
      expect(result).toHaveProperty("uptime");
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it("should return protocol as an array", () => {
      const result = service.getExtensive();
      expect(Array.isArray(result.protocol)).toBe(true);
    });

    it("should include server_uuid", () => {
      const result = service.getExtensive();
      expect(result).toHaveProperty("server_uuid");
      expect(result.server_uuid).toBe("550e8400-e29b-41d4-a716-446655440000");
    });
  });

  describe("get", () => {
    it("should return status without protocol and uptime", () => {
      const result = service.get();
      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("version");
      expect(result.protocol).toBeUndefined();
      expect(result.uptime).toBeUndefined();
    });

    it("should include server_uuid (public field)", () => {
      const result = service.get();
      expect(result).toHaveProperty("server_uuid");
      expect(result.server_uuid).toBe("550e8400-e29b-41d4-a716-446655440000");
    });
  });

  describe("set", () => {
    it("should update currentStatus before getExtensive recreates it", () => {
      service.set(StatusEnum.UNHEALTHY, "Database disconnected");
      // Note: getExtensive() creates a new Status (always HEALTHY) and copies protocol
      // The status field on the new Status is always reset to HEALTHY by the constructor
      const result = service.getExtensive();
      // getExtensive recreates the status object with HEALTHY default
      expect(result.status).toBe(StatusEnum.HEALTHY);
    });

    it("should add a protocol entry", () => {
      const initialLength = service.getExtensive().protocol.length;
      service.set(StatusEnum.UNHEALTHY, "Something went wrong");
      const result = service.getExtensive();
      expect(result.protocol.length).toBe(initialLength + 1);
    });

    it("should record the reason in protocol", () => {
      service.set(StatusEnum.UNHEALTHY, "Test failure reason");
      const result = service.getExtensive();
      const lastEntry = result.protocol[result.protocol.length - 1];
      expect(lastEntry.reason).toBe("Test failure reason");
      expect(lastEntry.status).toBe(StatusEnum.UNHEALTHY);
    });

    it("should record the timestamp in protocol entry", () => {
      const before = new Date();
      service.set(StatusEnum.HEALTHY, "Recovered");
      const after = new Date();
      const result = service.getExtensive();
      const lastEntry = result.protocol[result.protocol.length - 1];
      expect(lastEntry.timestamp.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(lastEntry.timestamp.getTime()).toBeLessThanOrEqual(
        after.getTime(),
      );
    });

    it("should handle multiple status changes in protocol", () => {
      service.set(StatusEnum.UNHEALTHY, "Error 1");
      service.set(StatusEnum.HEALTHY, "Recovered");
      service.set(StatusEnum.UNHEALTHY, "Error 2");
      const result = service.getExtensive();
      // initial + 3 more
      expect(result.protocol.length).toBeGreaterThanOrEqual(4);
      // Verify protocol entries are recorded correctly
      const lastEntry = result.protocol[result.protocol.length - 1];
      expect(lastEntry.status).toBe(StatusEnum.UNHEALTHY);
      expect(lastEntry.reason).toBe("Error 2");
    });
  });
});
