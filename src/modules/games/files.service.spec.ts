import {
  BadRequestException,
  NotFoundException,
  StreamableFile,
} from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";
import * as fsExtraModule from "fs-extra";
import { constants } from "fs-extra";
import type { Mock, Mocked } from "vitest";
import configurationModule from "../../configuration.js";
import { MetadataService } from "../metadata/metadata.service.js";
import { FilesService } from "./files.service.js";
import { GamesService } from "./games.service.js";

// We need to mock configuration before importing the service
vi.mock("../../configuration.js", async () => ({
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

vi.mock("../../globals.js", async () => {
  const actual = (await vi.importActual("../../globals.js")) as any;

  return {
    __esModule: true,
    ...actual,
    default: {
      ...actual.default,
      ARCHIVE_FORMATS: [".zip", ".7z", ".rar", ".tar", ".gz"],
    },
  };
});

vi.mock("../../logging.js", async () => ({
  logGamevaultGame: vi.fn((g) => ({ id: g?.id, path: g?.file_path })),
}));

vi.mock("fs-extra", async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  const overrides = {
    access: vi.fn(),
    constants: { W_OK: 2 },
    createReadStream: vi.fn(),
    pathExists: vi.fn(),
    rm: vi.fn(),
    stat: vi.fn(),
    writeFile: vi.fn(),
  };
  return {
    ...actual,
    ...overrides,
    default: { ...(actual as any).default, ...overrides },
  };
});

describe("FilesService", () => {
  let service: FilesService;
  let configuration: {
    TESTING: {
      MOCK_FILES: boolean;
    };
    GAMES: {
      SEARCH_EXCLUDE_FILE_REGEX?: RegExp;
      SEARCH_EXCLUDE_DIR_REGEX?: RegExp;
    };
  };
  let gamesService: Mocked<GamesService>;
  let metadataService: Mocked<MetadataService>;
  let schedulerRegistry: Mocked<SchedulerRegistry>;
  let gameVersionRepository: {
    find: Mock;
    findOne: Mock;
    save: Mock;
    recover: Mock;
    softDelete: Mock;
    createQueryBuilder: Mock;
  };
  let fsExtra: {
    access: Mock;
    pathExists: Mock;
    rm: Mock;
    stat: Mock;
    writeFile: Mock;
  };

  beforeEach(() => {
    fsExtra = fsExtraModule as any;
    configuration = configurationModule as any;
    configuration.GAMES.SEARCH_EXCLUDE_FILE_REGEX = undefined;
    configuration.GAMES.SEARCH_EXCLUDE_DIR_REGEX = undefined;

    gamesService = {
      findOneByGameIdOrFail: vi.fn(),
      generateSortTitle: vi.fn((t) => t.toLowerCase()),
      checkIfExistsInDatabase: vi.fn(),
      save: vi.fn(),
      find: vi.fn(),
      delete: vi.fn(),
      restore: vi.fn(),
    } as any;

    metadataService = {
      addUpdateMetadataJob: vi.fn(),
    } as any;

    schedulerRegistry = {
      getTimeouts: vi.fn().mockReturnValue([]),
      addTimeout: vi.fn(),
      deleteTimeout: vi.fn(),
    } as any;

    gameVersionRepository = {
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn(),
      save: vi.fn(),
      recover: vi.fn(),
      softDelete: vi.fn(),
      createQueryBuilder: vi.fn(),
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

    vi.spyOn(service as any, "index").mockResolvedValue(undefined);
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

      await expect(service.deleteGameFile(1, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should reject deletion when file does not exist", async () => {
      gamesService.findOneByGameIdOrFail.mockResolvedValue({
        id: 1,
        file_path: "/tmp/test-files/My Game.zip",
      } as any);
      gameVersionRepository.find.mockResolvedValueOnce([
        {
          id: 1,
          file_path: "/tmp/test-files/My Game.zip",
          version: "v1.0.0",
          size: 1000n,
          type: "WINDOWS_SETUP",
          early_access: false,
          indexed_at: new Date("2026-01-01"),
        },
      ] as any);
      fsExtra.pathExists.mockResolvedValueOnce(false);

      await expect(service.deleteGameFile(1, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should reject deletion when files volume is not writable", async () => {
      gamesService.findOneByGameIdOrFail.mockResolvedValue({
        id: 1,
        file_path: "/tmp/test-files/My Game.zip",
      } as any);
      gameVersionRepository.find.mockResolvedValueOnce([
        {
          id: 1,
          file_path: "/tmp/test-files/My Game.zip",
          version: "v1.0.0",
          size: 1000n,
          type: "WINDOWS_SETUP",
          early_access: false,
          indexed_at: new Date("2026-01-01"),
        },
      ] as any);
      fsExtra.pathExists.mockResolvedValueOnce(true);
      fsExtra.access.mockRejectedValueOnce(new Error("permission denied"));

      await expect(service.deleteGameFile(1, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should delete explicitly requested version by version id", async () => {
      gamesService.findOneByGameIdOrFail.mockResolvedValue({
        id: 1,
        file_path: "/tmp/test-files/My Game.zip",
      } as any);
      gameVersionRepository.find.mockResolvedValueOnce([
        {
          id: 1,
          file_path: "/tmp/test-files/My Game (v1.0.0).zip",
          version: "v1.0.0",
          size: 1000n,
          type: "WINDOWS_SETUP",
          early_access: false,
          indexed_at: new Date("2026-01-01"),
        },
        {
          id: 2,
          file_path: "/tmp/test-files/My Game (v2.0.0).zip",
          version: "v2.0.0",
          size: 1000n,
          type: "WINDOWS_SETUP",
          early_access: false,
          indexed_at: new Date("2026-01-02"),
        },
      ] as any);
      fsExtra.pathExists.mockResolvedValue(true);

      await service.deleteGameFile(1, 1);

      expect(fsExtra.rm).toHaveBeenCalledTimes(1);
      expect(fsExtra.rm).toHaveBeenCalledWith(
        "/tmp/test-files/My Game (v1.0.0).zip",
      );
    });

    it("should delete selected normalized version when legacy file path is missing", async () => {
      gamesService.findOneByGameIdOrFail.mockResolvedValue({
        id: 1,
        file_path: undefined,
      } as any);
      gameVersionRepository.find.mockResolvedValueOnce([
        {
          id: 2,
          file_path: "/tmp/test-files/My Game (v2.0.0).zip",
          version: "v2.0.0",
          size: 1000n,
          type: "WINDOWS_SETUP",
          early_access: false,
          indexed_at: new Date("2026-01-02"),
        },
      ] as any);
      fsExtra.pathExists.mockResolvedValueOnce(true);
      fsExtra.access.mockResolvedValueOnce(undefined);

      await service.deleteGameFile(1, 2);

      expect(fsExtra.rm).toHaveBeenCalledWith(
        "/tmp/test-files/My Game (v2.0.0).zip",
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
          id: 1,
          file_path: "/tmp/test-files/My Game (v1.0.0).zip",
          version: "v1.0.0",
          size: 1000n,
          type: "WINDOWS_SETUP",
          early_access: false,
          indexed_at: new Date("2026-01-01"),
        },
      ] as any);

      await expect(service.deleteGameFile(1, 999)).rejects.toThrow(
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
      gameVersionRepository.find.mockResolvedValueOnce([
        {
          id: 1,
          file_path: "/tmp/test-files/My Game.zip",
          version: "v1.0.0",
          size: 1000n,
          type: "WINDOWS_SETUP",
          early_access: false,
          indexed_at: new Date("2026-01-01"),
        },
      ] as any);

      const response = { setHeader: vi.fn() } as any;
      const result = await service.download(
        response,
        42,
        1,
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

      const response = { setHeader: vi.fn() } as any;

      await expect(
        service.download(response, 42, 999, undefined, undefined, 18),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("index", () => {
    it("should trigger integrity check when file stats are missing", async () => {
      vi.useFakeTimers();
      const localService = new FilesService(
        gamesService,
        metadataService,
        schedulerRegistry,
        gameVersionRepository as any,
      );
      const checkIntegritySpy = vi
        .spyOn(localService as any, "checkIntegrity")
        .mockResolvedValue([]);

      await (localService as any).index("/tmp/test-files/My Game.zip");
      vi.advanceTimersByTime(5000);
      await Promise.resolve();

      expect(checkIntegritySpy).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });
  });

  describe("checkIntegrity", () => {
    it("should delete migrated games that only have soft-deleted version history", async () => {
      configuration.TESTING.MOCK_FILES = false;

      gamesService.find.mockResolvedValueOnce([
        {
          id: 77,
          file_path: "/tmp/test-files/Shared Existing File.zip",
        },
      ] as any);

      gameVersionRepository.find
        .mockResolvedValueOnce([
          {
            id: 900,
            game: { id: 152, deleted_at: new Date("2023-06-07T21:00:06.370Z") },
            file_path: "/files/Honey, I Joined a Cult (2021).7z",
            deleted_at: undefined,
          },
        ] as any)
        .mockResolvedValueOnce([
          {
            id: 701,
            game: { id: 77 },
            file_path: "/tmp/test-files/Shared Existing File.zip",
            deleted_at: new Date("2026-01-01T00:00:00.000Z"),
          },
        ] as any);

      vi.spyOn(service as any, "readAllFiles").mockResolvedValueOnce([
        {
          path: "/tmp/test-files/Shared Existing File.zip",
          size: 123,
        },
      ]);

      await (service as any).checkIntegrity();

      expect(gameVersionRepository.softDelete).toHaveBeenCalledWith([900]);
      expect(gamesService.delete).toHaveBeenCalledWith(77);
    });
  });

  describe("upsertReleaseRecord", () => {
    it("should create a new release row when none exists", async () => {
      gameVersionRepository.findOne.mockResolvedValueOnce(null);
      gameVersionRepository.save.mockResolvedValueOnce(undefined);

      await (service as any).upsertReleaseRecord(9, {
        file_path: "/tmp/test-files/Game (v2).zip",
        version: "v2",
        size: 2000n,
        release_date: new Date("2025-01-01T00:00:00.000Z"),
        early_access: true,
        type: "WINDOWS_PORTABLE",
      });

      expect(gameVersionRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            game: { id: 9 },
            file_path: "/tmp/test-files/Game (v2).zip",
          },
          withDeleted: true,
        }),
      );
      expect(gameVersionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: undefined,
          game: { id: 9 },
          file_path: "/tmp/test-files/Game (v2).zip",
          version: "v2",
          size: 2000n,
          early_access: true,
          type: "WINDOWS_PORTABLE",
          deleted_at: null,
        }),
      );
    });

    it("should update an existing release row by reusing its id", async () => {
      gameVersionRepository.findOne.mockResolvedValueOnce({
        id: 42,
        file_path: "/tmp/test-files/Game (v2).zip",
      });
      gameVersionRepository.save.mockResolvedValueOnce(undefined);

      await (service as any).upsertReleaseRecord(9, {
        file_path: "/tmp/test-files/Game (v2).zip",
        version: "v2",
        size: 2000n,
        release_date: new Date("2025-01-01T00:00:00.000Z"),
        early_access: true,
        type: "WINDOWS_PORTABLE",
      });

      expect(gameVersionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 42,
          game: { id: 9 },
          file_path: "/tmp/test-files/Game (v2).zip",
          deleted_at: null,
        }),
      );
    });
  });

  describe("search exclude regex filters", () => {
    it("should exclude files matching GAMES_SEARCH_EXCLUDE_FILE_REGEX", () => {
      configuration.GAMES.SEARCH_EXCLUDE_FILE_REGEX = /sample/i;

      expect((service as any).shouldIncludeFile("My Sample Game.zip")).toBe(
        false,
      );
      expect((service as any).shouldIncludeFile("My Real Game.zip")).toBe(true);
    });

    it("should exclude directories matching GAMES_SEARCH_EXCLUDE_DIR_REGEX", () => {
      configuration.GAMES.SEARCH_EXCLUDE_DIR_REGEX = /^ignored$/i;

      expect((service as any).shouldIncludeDirectory("ignored")).toBe(false);
      expect((service as any).shouldIncludeDirectory("games")).toBe(true);
    });

    it("should still apply normal filename validation after regex checks", () => {
      configuration.GAMES.SEARCH_EXCLUDE_FILE_REGEX = /^ignore-/i;

      expect((service as any).shouldIncludeFile("ignore-demo.zip")).toBe(false);
      expect((service as any).shouldIncludeFile("valid-title.zip")).toBe(true);
      expect((service as any).shouldIncludeFile("valid-title.txt")).toBe(false);
    });
  });
});
