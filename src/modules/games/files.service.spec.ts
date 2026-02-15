import {
  BadRequestException,
  NotFoundException,
  StreamableFile,
} from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";
import { constants } from "fs-extra";
import { MetadataService } from "../metadata/metadata.service";
import { FilesService } from "./files.service";
import { GamesService } from "./games.service";

// We need to mock configuration before importing the service
jest.mock("../../configuration", () => ({
  __esModule: true,
  default: {
    TESTING: { MOCK_FILES: true },
    VOLUMES: { FILES: "/tmp/test-files" },
    GAMES: {
      SUPPORTED_FILE_FORMATS: [".zip", ".7z", ".rar", ".tar", ".gz", ".exe"],
      SEARCH_RECURSIVE: false,
      INDEX_INTERVAL_IN_MINUTES: 0,
      INDEX_USE_POLLING: false,
      INDEX_CONCURRENCY: 1,
      DEFAULT_ARCHIVE_PASSWORD: "",
      MAX_UPLOAD_SIZE: 1073741824,
    },
    SERVER: { MAX_DOWNLOAD_BANDWIDTH_IN_KBPS: 0 },
  },
}));

jest.mock("../../globals", () => ({
  __esModule: true,
  default: {
    ARCHIVE_FORMATS: [".zip", ".7z", ".rar", ".tar", ".gz"],
  },
}));

jest.mock("../../logging", () => ({
  logGamevaultGame: jest.fn((g) => ({ id: g?.id, path: g?.file_path })),
}));

jest.mock("fs-extra", () => ({
  access: jest.fn(),
  constants: { W_OK: 2 },
  createReadStream: jest.fn(),
  pathExists: jest.fn(),
  rm: jest.fn(),
  stat: jest.fn(),
  writeFile: jest.fn(),
}));

describe("FilesService", () => {
  let service: FilesService;
  let gamesService: jest.Mocked<GamesService>;
  let metadataService: jest.Mocked<MetadataService>;
  let schedulerRegistry: jest.Mocked<SchedulerRegistry>;
  let gameVersionRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
  };
  let fsExtra: {
    access: jest.Mock;
    pathExists: jest.Mock;
    rm: jest.Mock;
    stat: jest.Mock;
    writeFile: jest.Mock;
  };

  beforeEach(() => {
    fsExtra = jest.requireMock("fs-extra");

    gamesService = {
      findOneByGameIdOrFail: jest.fn(),
      generateSortTitle: jest.fn((t) => t.toLowerCase()),
      checkIfExistsInDatabase: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
      restore: jest.fn(),
    } as any;

    metadataService = {
      addUpdateMetadataJob: jest.fn(),
    } as any;

    schedulerRegistry = {
      getTimeouts: jest.fn().mockReturnValue([]),
      addTimeout: jest.fn(),
      deleteTimeout: jest.fn(),
    } as any;

    gameVersionRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    service = new FilesService(
      gamesService,
      metadataService,
      schedulerRegistry,
      gameVersionRepository as any,
    );

    fsExtra.access.mockResolvedValue(undefined);
    fsExtra.pathExists.mockResolvedValue(false);
    fsExtra.rm.mockResolvedValue(undefined);
    fsExtra.stat.mockResolvedValue({ size: 1000 });
    fsExtra.writeFile.mockResolvedValue(undefined);

    jest.spyOn(service as any, "index").mockResolvedValue(undefined);
  });

  describe("upload", () => {
    it("should reject invalid sanitized filename", async () => {
      await expect(
        service.upload({
          originalname: "///",
          buffer: Buffer.from("test"),
          size: 4,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it("should reject unsupported file formats", async () => {
      await expect(
        service.upload({
          originalname: "game.txt",
          buffer: Buffer.from("test"),
          size: 4,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it("should reject upload when files volume is not writable", async () => {
      fsExtra.access.mockRejectedValueOnce(new Error("permission denied"));

      await expect(
        service.upload({
          originalname: "game.zip",
          buffer: Buffer.from("test"),
          size: 4,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it("should reject upload when target file already exists", async () => {
      fsExtra.pathExists.mockResolvedValueOnce(true);

      await expect(
        service.upload({
          originalname: "game.zip",
          buffer: Buffer.from("test"),
          size: 4,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it("should persist uploaded file and trigger indexing", async () => {
      const result = await service.upload({
        originalname: "My Game.zip",
        buffer: Buffer.from("payload"),
        size: 7,
      } as any);

      expect(fsExtra.access).toHaveBeenCalledWith(
        "/tmp/test-files",
        constants.W_OK,
      );
      expect(fsExtra.writeFile).toHaveBeenCalledWith(
        "/tmp/test-files/My Game.zip",
        expect.any(Buffer),
      );
      expect((service as any).index).toHaveBeenCalledWith(
        "/tmp/test-files/My Game.zip",
        expect.any(Object),
      );
      expect(result).toEqual({ path: "/tmp/test-files/My Game.zip" });
    });
  });

  describe("deleteGameFile", () => {
    it("should reject deletion when game has no available versions", async () => {
      gamesService.findOneByGameIdOrFail.mockResolvedValue({
        id: 1,
        file_path: null,
      } as any);

      await expect(service.deleteGameFile(1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should reject deletion when file does not exist", async () => {
      gamesService.findOneByGameIdOrFail.mockResolvedValue({
        id: 1,
        file_path: "/tmp/test-files/My Game.zip",
      } as any);
      fsExtra.pathExists.mockResolvedValueOnce(false);

      await expect(service.deleteGameFile(1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should reject deletion when files volume is not writable", async () => {
      gamesService.findOneByGameIdOrFail.mockResolvedValue({
        id: 1,
        file_path: "/tmp/test-files/My Game.zip",
      } as any);
      fsExtra.pathExists.mockResolvedValueOnce(true);
      fsExtra.access.mockRejectedValueOnce(new Error("permission denied"));

      await expect(service.deleteGameFile(1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should remove all game version files from disk when no version is provided", async () => {
      const game = { id: 1, file_path: "/tmp/test-files/My Game.zip" } as any;
      gamesService.findOneByGameIdOrFail.mockResolvedValue(game);
      gameVersionRepository.find.mockResolvedValueOnce([
        {
          file_path: "/tmp/test-files/My Game (v1.0.0).zip",
          version: "v1.0.0",
          size: 1000n,
          type: "WINDOWS_SETUP",
          early_access: false,
          indexed_at: new Date("2026-01-01"),
        },
        {
          file_path: "/tmp/test-files/My Game (v2.0.0).zip",
          version: "v2.0.0",
          size: 1000n,
          type: "WINDOWS_SETUP",
          early_access: false,
          indexed_at: new Date("2026-01-02"),
        },
      ] as any);
      fsExtra.pathExists.mockResolvedValue(true);

      await service.deleteGameFile(1);

      expect(fsExtra.rm).toHaveBeenCalledTimes(2);
      expect(fsExtra.rm).toHaveBeenCalledWith(
        "/tmp/test-files/My Game (v1.0.0).zip",
      );
      expect(fsExtra.rm).toHaveBeenCalledWith(
        "/tmp/test-files/My Game (v2.0.0).zip",
      );
    });

    it("should delete selected normalized version when legacy file path is missing", async () => {
      gamesService.findOneByGameIdOrFail.mockResolvedValue({
        id: 1,
        file_path: undefined,
      } as any);
      gameVersionRepository.find.mockResolvedValueOnce([
        {
          file_path: "/tmp/test-files/My Game (v2.0.0).zip",
          version: "v2.0.0",
          size: 1000n,
          type: "WINDOWS_SETUP",
          early_access: false,
          indexed_at: new Date("2026-01-02"),
        },
      ] as any);
      fsExtra.pathExists.mockResolvedValueOnce(true);

      await service.deleteGameFile(1);

      expect(fsExtra.rm).toHaveBeenCalledWith(
        "/tmp/test-files/My Game (v2.0.0).zip",
      );
    });

    it("should delete explicitly requested version", async () => {
      gamesService.findOneByGameIdOrFail.mockResolvedValue({
        id: 1,
        file_path: "/tmp/test-files/My Game (v1.0.0).zip",
      } as any);
      gameVersionRepository.find.mockResolvedValueOnce([
        {
          file_path: "/tmp/test-files/My Game (v1.0.0).zip",
          version: "v1.0.0",
          size: 1000n,
          type: "WINDOWS_SETUP",
          early_access: false,
          indexed_at: new Date("2026-01-01"),
        },
        {
          file_path: "/tmp/test-files/My Game (v2.0.0).zip",
          version: "v2.0.0",
          size: 1000n,
          type: "WINDOWS_SETUP",
          early_access: false,
          indexed_at: new Date("2026-01-02"),
        },
      ] as any);
      fsExtra.pathExists.mockResolvedValueOnce(true);

      await service.deleteGameFile(1, "v1.0.0");

      expect(fsExtra.rm).toHaveBeenCalledWith(
        "/tmp/test-files/My Game (v1.0.0).zip",
      );
    });

    it("should reject deletion when requested version does not exist", async () => {
      fsExtra.rm.mockClear();

      gamesService.findOneByGameIdOrFail.mockResolvedValue({
        id: 1,
        file_path: "/tmp/test-files/My Game (v1.0.0).zip",
      } as any);
      gameVersionRepository.find.mockResolvedValueOnce([
        {
          file_path: "/tmp/test-files/My Game (v1.0.0).zip",
          version: "v1.0.0",
          size: 1000n,
          type: "WINDOWS_SETUP",
          early_access: false,
          indexed_at: new Date("2026-01-01"),
        },
      ] as any);

      await expect(service.deleteGameFile(1, "v9.9.9")).rejects.toThrow(
        NotFoundException,
      );
      expect(fsExtra.rm).not.toHaveBeenCalled();
    });
  });

  describe("download", () => {
    it("should return a StreamableFile in testing mock mode", async () => {
      gamesService.findOneByGameIdOrFail.mockResolvedValue({
        id: 42,
        file_path: "/tmp/test-files/My Game.zip",
        download_count: 0,
      } as any);

      const response = { setHeader: jest.fn() } as any;
      const result = await service.download(
        response,
        42,
        undefined,
        undefined,
        18,
      );

      expect(result).toBeInstanceOf(StreamableFile);
      expect(gamesService.findOneByGameIdOrFail).toHaveBeenCalledWith(42, {
        loadDeletedEntities: false,
        filterByAge: 18,
      });
      expect(gamesService.save).not.toHaveBeenCalled();
    });

    it("should reject download when requested version does not exist", async () => {
      gamesService.findOneByGameIdOrFail.mockResolvedValue({
        id: 42,
        file_path: "/tmp/test-files/My Game (v1.0.0).zip",
        version: "v1.0.0",
        size: 1000n,
        type: "WINDOWS_SETUP",
        early_access: false,
        download_count: 0,
      } as any);

      const response = { setHeader: jest.fn() } as any;

      await expect(
        service.download(response, 42, undefined, undefined, 18, "v9.9.9"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("listAvailableVersions", () => {
    it("should return sorted available versions", async () => {
      gamesService.findOneByGameIdOrFail.mockResolvedValue({
        id: 1,
        file_path: "/tmp/test-files/My Game (v1.0.0).zip",
        version: "v1.0.0",
        size: 1000n,
        type: "WINDOWS_SETUP",
        early_access: false,
      } as any);
      gameVersionRepository.find.mockResolvedValue([
        {
          file_path: "/tmp/test-files/My Game (v1.0.0).zip",
          version: "v1.0.0",
          size: 1000n,
          type: "WINDOWS_SETUP",
          early_access: false,
          indexed_at: new Date("2026-01-01"),
        },
        {
          file_path: "/tmp/test-files/My Game (v2.0.0).zip",
          version: "v2.0.0",
          size: 1000n,
          type: "WINDOWS_SETUP",
          early_access: false,
          indexed_at: new Date("2026-01-02"),
        },
      ] as any);

      const result = await service.listAvailableVersions(1, 18);

      expect(result.map((v) => v.version)).toEqual(["v2.0.0", "v1.0.0"]);
      expect(gamesService.findOneByGameIdOrFail).toHaveBeenCalledWith(1, {
        loadDeletedEntities: false,
        filterByAge: 18,
      });
    });

    it("should sort mixed non-semver versions with best-effort fallback", async () => {
      gamesService.findOneByGameIdOrFail.mockResolvedValue({
        id: 1,
        file_path: "/tmp/test-files/My Game (vBuild 15-01-2024).zip",
        version: "vBuild 15-01-2024",
        size: 1000n,
        type: "WINDOWS_SETUP",
        early_access: false,
      } as any);
      gameVersionRepository.find.mockResolvedValue([
        {
          file_path: "/tmp/test-files/My Game (v1.0.0.2).zip",
          version: "v1.0.0.2",
          size: 1000n,
          type: "WINDOWS_SETUP",
          early_access: false,
          indexed_at: new Date("2026-01-01"),
        },
        {
          file_path: "/tmp/test-files/My Game (v2025-04-27).zip",
          version: "v2025-04-27",
          size: 1000n,
          type: "WINDOWS_SETUP",
          early_access: false,
          indexed_at: new Date("2026-01-02"),
        },
        {
          file_path: "/tmp/test-files/My Game (vBuild 15-01-2024).zip",
          version: "vBuild 15-01-2024",
          size: 1000n,
          type: "WINDOWS_SETUP",
          early_access: false,
          indexed_at: new Date("2026-01-03"),
        },
      ] as any);

      const result = await service.listAvailableVersions(1, 18);

      expect(result.map((v) => v.version)).toEqual([
        "v1.0.0.2",
        "v2025-04-27",
        "vBuild 15-01-2024",
      ]);
    });
  });

  describe("getLatestVersion", () => {
    it("should return the first sorted version", async () => {
      jest.spyOn(service, "listAvailableVersions").mockResolvedValue([
        {
          file_path: "/tmp/test-files/My Game (v2.0.0).zip",
          version: "v2.0.0",
        },
        {
          file_path: "/tmp/test-files/My Game (v1.0.0).zip",
          version: "v1.0.0",
        },
      ] as any);

      const result = await service.getLatestVersion(1, 18);

      expect(result.version).toBe("v2.0.0");
      expect(service.listAvailableVersions).toHaveBeenCalledWith(1, 18);
    });

    it("should throw if no versions are available", async () => {
      jest.spyOn(service, "listAvailableVersions").mockResolvedValue([] as any);

      await expect(service.getLatestVersion(1, 18)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
