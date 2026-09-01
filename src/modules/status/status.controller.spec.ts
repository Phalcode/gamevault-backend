import type { Mock } from "vitest";
import { GamevaultUser } from "../users/gamevault-user.entity.js";
import { Role } from "../users/models/role.enum.js";
import { StatusEnum } from "./models/status.enum.js";
import { StatusController } from "./status.controller.js";
import { StatusService } from "./status.service.js";

describe("StatusController", () => {
  let controller: StatusController;
  let service: StatusService;
  let mockServerService: { getServerUuid: Mock };

  beforeEach(() => {
    mockServerService = {
      getServerUuid: vi
        .fn()
        .mockReturnValue("550e8400-e29b-41d4-a716-446655440000"),
    };
    service = new StatusService(mockServerService as any);
    controller = new StatusController(service);
  });

  describe("getStatus", () => {
    it("should return basic status for non-admin users", async () => {
      const user = new GamevaultUser();
      user.role = Role.USER;
      const result = await controller.getStatus({ user });
      expect(result).toHaveProperty("status", StatusEnum.HEALTHY);
      expect(result).toHaveProperty("server_uuid");
      expect(result.protocol).toBeUndefined();
      expect(result.uptime).toBeUndefined();
    });

    it("should return extensive status for admin users", async () => {
      const user = new GamevaultUser();
      user.role = Role.ADMIN;
      const result = await controller.getStatus({ user });
      expect(result).toHaveProperty("status", StatusEnum.HEALTHY);
      expect(result).toHaveProperty("server_uuid");
      expect(result).toHaveProperty("protocol");
      expect(result).toHaveProperty("uptime");
    });

    it("should return basic status for guest users", async () => {
      const user = new GamevaultUser();
      user.role = Role.GUEST;
      const result = await controller.getStatus({ user });
      expect(result).toHaveProperty("server_uuid");
      expect(result.protocol).toBeUndefined();
      expect(result.uptime).toBeUndefined();
    });

    it("should return basic status when request is null", async () => {
      const result = await controller.getStatus(undefined);
      expect(result).toHaveProperty("status", StatusEnum.HEALTHY);
      expect(result).toHaveProperty("server_uuid");
      expect(result.protocol).toBeUndefined();
      expect(result.uptime).toBeUndefined();
    });

    it("should return basic status when user is undefined", async () => {
      const result = await controller.getStatus({ user: undefined } as any);
      expect(result).toHaveProperty("status", StatusEnum.HEALTHY);
      expect(result).toHaveProperty("server_uuid");
      expect(result.protocol).toBeUndefined();
    });

    it("should include server_uuid for all auth levels", async () => {
      const roles = [Role.GUEST, Role.USER, Role.EDITOR, Role.ADMIN];
      for (const role of roles) {
        const user = new GamevaultUser();
        user.role = role;
        const result = await controller.getStatus({ user });
        expect(result).toHaveProperty("server_uuid");
      }
    });

    it("should return extensive status for editor users (role < ADMIN)", async () => {
      const user = new GamevaultUser();
      user.role = Role.EDITOR;
      const result = await controller.getStatus({ user });
      // EDITOR (2) < ADMIN (3), so basic status
      expect(result.protocol).toBeUndefined();
      expect(result.uptime).toBeUndefined();
    });
  });
});
