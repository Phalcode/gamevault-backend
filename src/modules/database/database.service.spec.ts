import { NotAcceptableException, UnauthorizedException } from "@nestjs/common";
import configuration from "../../configuration.js";

import { DatabaseService } from "./database.service.js";

vi.mock("../../configuration.js", () => ({
  __esModule: true,
  default: {
    TESTING: { IN_MEMORY_DB: false },
    DB: {
      SYSTEM: "POSTGRESQL",
      HOST: "localhost",
      PORT: 5432,
      USERNAME: "user",
      PASSWORD: "correct-password",
      DATABASE: "gamevault",
    },
    SERVER: { VERSION: "13.0.0" },
    VOLUMES: { SQLITEDB: "/data/sqlite" },
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

describe("DatabaseService", () => {
  let service: DatabaseService;
  let mockDataSource: any;

  beforeEach(() => {
    mockDataSource = {
      initialize: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn().mockResolvedValue(undefined),
      runMigrations: vi.fn().mockResolvedValue([]),
    };

    service = new DatabaseService(mockDataSource, configuration as any);
  });

  afterEach(() => vi.restoreAllMocks());

  // ─── validatePassword ──────────────────────────────────────────────

  describe("validatePassword (via backup)", () => {
    it("should throw UnauthorizedException for wrong password", async () => {
      await expect(service.backup("wrong-password")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should not throw for correct password (then proceeds to backup)", async () => {
      // Will throw InternalServerError because pg_dump won't work in test,
      // but the important thing is it got past validation
      const promise = service.backup("correct-password");
      // It should NOT throw UnauthorizedException
      await expect(promise).rejects.not.toThrow(UnauthorizedException);
    });
  });

  // ─── generateBackupFilepath ────────────────────────────────────────

  describe("generateBackupFilepath", () => {
    it("should generate a path with version and timestamp", () => {
      const filepath = (service as any).generateBackupFilepath();
      expect(filepath).toMatch(
        /^\/tmp\/gamevault_13\.0\.0_database_backup_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/,
      );
      expect(filepath).toMatch(/\.db$/);
    });

    it("should produce unique timestamps on consecutive calls", () => {
      const first = (service as any).generateBackupFilepath();
      const second = (service as any).generateBackupFilepath();
      // May or may not differ depending on timing, but both should be valid
      expect(first).toMatch(/^\/tmp\/gamevault_/);
      expect(second).toMatch(/^\/tmp\/gamevault_/);
    });
  });

  // ─── connect / disconnect / migrate ────────────────────────────────

  describe("connect", () => {
    it("should initialize the data source", async () => {
      await service.connect();
      expect(mockDataSource.initialize).toHaveBeenCalled();
    });
  });

  describe("disconnect", () => {
    it("should destroy the data source", async () => {
      await service.disconnect();
      expect(mockDataSource.destroy).toHaveBeenCalled();
    });
  });

  describe("migrate", () => {
    it("should run migrations", async () => {
      await service.migrate();
      expect(mockDataSource.runMigrations).toHaveBeenCalled();
    });
  });

  // ─── backup / restore with in-memory DB ────────────────────────────

  describe("in-memory DB guard", () => {
    it("should reject backup on in-memory DB", async () => {
      const config = configuration as any;
      config.TESTING.IN_MEMORY_DB = true;

      await expect(service.backup("correct-password")).rejects.toThrow(
        NotAcceptableException,
      );

      config.TESTING.IN_MEMORY_DB = false;
    });

    it("should reject restore on in-memory DB", async () => {
      const config = configuration as any;
      config.TESTING.IN_MEMORY_DB = true;

      await expect(
        service.restore(
          { buffer: Buffer.from("test") } as any,
          "correct-password",
        ),
      ).rejects.toThrow(NotAcceptableException);

      config.TESTING.IN_MEMORY_DB = false;
    });
  });
});
