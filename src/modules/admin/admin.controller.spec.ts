import type { Mocked } from "vitest";
import { DatabaseService } from "../database/database.service.js";
import { WebUIService } from "../web-ui/web-ui.service.js";
import { AdminController } from "./admin.controller.js";

describe("AdminController", () => {
  let controller: AdminController;
  let databaseService: Mocked<DatabaseService>;
  let webUIService: Mocked<WebUIService>;

  beforeEach(() => {
    databaseService = {
      backup: vi.fn(),
      restore: vi.fn(),
    } as any;

    webUIService = {
      cleanCacheExceptZip: vi.fn(),
      prepareFrontend: vi.fn(),
    } as any;

    controller = new AdminController(databaseService, webUIService);
  });

  describe("getAdminDatabaseBackup", () => {
    it("should call databaseService.backup with password", async () => {
      const mockBackup = { data: "backup-data" };
      databaseService.backup.mockResolvedValue(mockBackup as any);

      const result = await controller.getAdminDatabaseBackup("SecretPass123");
      expect(result).toEqual(mockBackup);
      expect(databaseService.backup).toHaveBeenCalledWith("SecretPass123");
    });
  });

  describe("postAdminDatabaseRestore", () => {
    it("should call databaseService.restore with file and password", async () => {
      const mockFile = {
        buffer: Buffer.from("backup-data"),
        originalname: "backup.sql",
      } as Express.Multer.File;
      databaseService.restore.mockResolvedValue(undefined);

      await controller.postAdminDatabaseRestore(mockFile, "SecretPass123");
      expect(databaseService.restore).toHaveBeenCalledWith(
        mockFile,
        "SecretPass123",
      );
    });
  });

  describe("postAdminWebUIRestart", () => {
    it("should clean cache and re-prepare frontend", async () => {
      webUIService.cleanCacheExceptZip.mockResolvedValue(undefined);
      webUIService.prepareFrontend.mockResolvedValue(undefined);

      await controller.postAdminWebUIRestart();
      expect(webUIService.cleanCacheExceptZip).toHaveBeenCalled();
      expect(webUIService.prepareFrontend).toHaveBeenCalled();
    });

    it("should call cleanCacheExceptZip before prepareFrontend", async () => {
      const callOrder: string[] = [];
      webUIService.cleanCacheExceptZip.mockImplementation(async () => {
        callOrder.push("clean");
      });
      webUIService.prepareFrontend.mockImplementation(async () => {
        callOrder.push("prepare");
      });

      await controller.postAdminWebUIRestart();
      expect(callOrder).toEqual(["clean", "prepare"]);
    });
  });
});
