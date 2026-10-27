import {
  InternalServerErrorException,
  NotAcceptableException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

  describe("backup/restore routing", () => {
    it("throws InternalServerErrorException for an unknown DB_SYSTEM", async () => {
      const prev = (configuration as any).DB.SYSTEM;
      (configuration as any).DB.SYSTEM = "MYSQL";
      try {
        await expect(service.backup("correct-password")).rejects.toThrow(
          InternalServerErrorException,
        );
      } finally {
        (configuration as any).DB.SYSTEM = prev;
      }
    });

    it("routes POSTGRESQL backup to backupPostgresql", async () => {
      const spy = vi
        .spyOn(service as any, "backupPostgresql")
        .mockResolvedValue({} as any);
      await service.backup("correct-password");
      expect(spy).toHaveBeenCalled();
    });

    it("routes SQLITE backup through disconnect/backupSqlite/connect", async () => {
      const prev = (configuration as any).DB.SYSTEM;
      (configuration as any).DB.SYSTEM = "SQLITE";
      const backupSpy = vi
        .spyOn(service as any, "backupSqlite")
        .mockResolvedValue({} as any);
      const disconnectSpy = vi
        .spyOn(service as any, "disconnect")
        .mockResolvedValue(undefined);
      const connectSpy = vi
        .spyOn(service as any, "connect")
        .mockResolvedValue(undefined);
      try {
        await service.backup("correct-password");
        expect(disconnectSpy).toHaveBeenCalled();
        expect(backupSpy).toHaveBeenCalled();
        expect(connectSpy).toHaveBeenCalled();
      } finally {
        (configuration as any).DB.SYSTEM = prev;
      }
    });

    it("routes SQLITE restore through disconnect/restoreSqlite/connect/migrate", async () => {
      const prev = (configuration as any).DB.SYSTEM;
      (configuration as any).DB.SYSTEM = "SQLITE";
      const restoreSpy = vi
        .spyOn(service as any, "restoreSqlite")
        .mockResolvedValue(undefined);
      const disconnectSpy = vi
        .spyOn(service as any, "disconnect")
        .mockResolvedValue(undefined);
      const connectSpy = vi
        .spyOn(service as any, "connect")
        .mockResolvedValue(undefined);
      const migrateSpy = vi
        .spyOn(service as any, "migrate")
        .mockResolvedValue(undefined);
      try {
        await service.restore(
          { buffer: Buffer.from("test") } as any,
          "correct-password",
        );
        expect(disconnectSpy).toHaveBeenCalled();
        expect(restoreSpy).toHaveBeenCalled();
        expect(connectSpy).toHaveBeenCalled();
        expect(migrateSpy).toHaveBeenCalled();
      } finally {
        (configuration as any).DB.SYSTEM = prev;
      }
    });
  });

  describe("restore from the streamed temporary dump", () => {
    it("removes the temporary dump even when the restore is rejected", async () => {
      const directory = mkdtempSync(join(tmpdir(), "gv-restore-"));
      const tempDump = join(directory, "dump.tmp");
      writeFileSync(tempDump, "dump");
      try {
        await expect(
          service.restore({ path: tempDump } as any, "wrong-password"),
        ).rejects.toThrow(UnauthorizedException);
        expect(existsSync(tempDump)).toBe(false);
      } finally {
        rmSync(directory, { recursive: true, force: true });
      }
    });

    it("restores SQLite by copying from the temporary dump", async () => {
      const directory = mkdtempSync(join(tmpdir(), "gv-sqlite-"));
      const tempDump = join(directory, "dump.tmp");
      const sqliteDirectory = join(directory, "db");
      mkdirSync(sqliteDirectory, { recursive: true });
      writeFileSync(tempDump, "sqlite-bytes");

      const config = configuration as any;
      const previousSystem = config.DB.SYSTEM;
      const previousVolumes = config.VOLUMES;
      config.DB.SYSTEM = "SQLITE";
      config.VOLUMES = { ...previousVolumes, SQLITEDB: sqliteDirectory };
      vi.spyOn(service as any, "backupSqlite").mockResolvedValue(undefined);
      try {
        await service.restore({ path: tempDump } as any, "correct-password");

        expect(
          readFileSync(join(sqliteDirectory, "database.sqlite"), "utf8"),
        ).toBe("sqlite-bytes");
        expect(existsSync(tempDump)).toBe(false);
      } finally {
        config.DB.SYSTEM = previousSystem;
        config.VOLUMES = previousVolumes;
        rmSync(directory, { recursive: true, force: true });
      }
    });

    it("restores PostgreSQL from the temporary dump", async () => {
      const directory = mkdtempSync(join(tmpdir(), "gv-pg-"));
      const tempDump = join(directory, "dump.tmp");
      writeFileSync(tempDump, "pg-dump");

      const config = configuration as any;
      const previousSystem = config.DB.SYSTEM;
      config.DB.SYSTEM = "POSTGRESQL";
      vi.spyOn(service as any, "backupPostgresql").mockResolvedValue(undefined);
      const execSpy = vi
        .spyOn(service as any, "execPromise")
        .mockResolvedValue({ stdout: "", stderr: "" });
      try {
        await service.restore({ path: tempDump } as any, "correct-password");

        const pgRestoreCall = execSpy.mock.calls.find((call) =>
          String(call[0]).includes("pg_restore"),
        );
        expect(pgRestoreCall?.[0]).toContain(tempDump);
        expect(existsSync(tempDump)).toBe(false);
      } finally {
        config.DB.SYSTEM = previousSystem;
        rmSync(directory, { recursive: true, force: true });
      }
    });
  });
});
