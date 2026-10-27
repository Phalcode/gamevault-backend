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
import { GameExistence } from "./models/game-existence.enum.js";
import { GameType } from "./models/game-type.enum.js";

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
    move: vi.fn(),
    pathExists: vi.fn(),
    remove: vi.fn(),
    rm: vi.fn(),
    stat: vi.fn(),
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
    remove: Mock;
    rm: Mock;
    stat: Mock;
    move: Mock;
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
    fsExtra.remove.mockResolvedValue(undefined);
    fsExtra.rm.mockResolvedValue(undefined);
    fsExtra.stat.mockResolvedValue({ size: 1000 });
    fsExtra.move.mockResolvedValue(undefined);

    vi.spyOn(service as any, "index").mockResolvedValue(undefined);
  });

  describe("upload", () => {
    const tempPath = "/tmp/test-files/.gamevault-upload-temp";

    const createUploadFile = (
      originalname: string,
      overrides: Partial<Express.Multer.File> = {},
    ) =>
      ({
        originalname,
        path: tempPath,
        size: 4,
        ...overrides,
      }) as unknown as Express.Multer.File;

    it("should reject invalid sanitized filename", async () => {
      await expect(service.upload(createUploadFile("///"))).rejects.toThrow(
        BadRequestException,
      );
      expect(fsExtra.remove).toHaveBeenCalledWith(tempPath);
    });

    it("should reject unsupported file formats", async () => {
      await expect(
        service.upload(createUploadFile("game.txt")),
      ).rejects.toThrow(BadRequestException);
      expect(fsExtra.remove).toHaveBeenCalledWith(tempPath);
    });

    it("should reject upload when files volume is not writable", async () => {
      fsExtra.access.mockRejectedValueOnce(new Error("permission denied"));

      await expect(
        service.upload(createUploadFile("game.zip")),
      ).rejects.toThrow(BadRequestException);
      expect(fsExtra.remove).toHaveBeenCalledWith(tempPath);
    });

    it("should reject upload when target file already exists", async () => {
      fsExtra.pathExists.mockResolvedValueOnce(true);

      await expect(
        service.upload(createUploadFile("game.zip")),
      ).rejects.toThrow(BadRequestException);
      expect(fsExtra.remove).toHaveBeenCalledWith(tempPath);
    });

    it("should move the streamed upload to its final location and trigger indexing", async () => {
      const result = await service.upload(createUploadFile("My Game.zip"));

      expect(fsExtra.access).toHaveBeenCalledWith(
        "/tmp/test-files",
        constants.W_OK,
      );
      expect(fsExtra.move).toHaveBeenCalledWith(
        tempPath,
        "/tmp/test-files/My Game.zip",
        { overwrite: false },
      );
      expect(fsExtra.remove).not.toHaveBeenCalled();
      expect((service as any).index).toHaveBeenCalledWith(
        "/tmp/test-files/My Game.zip",
        expect.any(Object),
      );
      expect(result).toEqual({ path: "/tmp/test-files/My Game.zip" });
    });

    it("should discard the temporary file when moving fails", async () => {
      fsExtra.move.mockRejectedValueOnce(new Error("disk full"));

      await expect(
        service.upload(createUploadFile("game.zip")),
      ).rejects.toThrow(BadRequestException);
      expect(fsExtra.remove).toHaveBeenCalledWith(tempPath);
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

  describe("calculateRange", () => {
    it("returns the full file when no range header is given", () => {
      expect((service as any).calculateRange(undefined, 1000)).toEqual({
        start: 0,
        end: 999,
        size: 1000,
      });
    });

    it("parses a start-end range", () => {
      expect((service as any).calculateRange("bytes=0-1023", 2000)).toEqual({
        start: 0,
        end: 1023,
        size: 1024,
      });
    });

    it("parses an open-ended suffix range", () => {
      expect((service as any).calculateRange("bytes=1024-", 2000)).toEqual({
        start: 1024,
        end: 1999,
        size: 976,
      });
    });

    it("parses a suffix-only range", () => {
      // "bytes=-100" keeps start 0 and sets end to 100 (code behavior).
      expect((service as any).calculateRange("bytes=-100", 2000)).toEqual({
        start: 0,
        end: 100,
        size: 101,
      });
    });

    it("keeps the default end when end is before start", () => {
      expect((service as any).calculateRange("bytes=200-100", 2000)).toEqual({
        start: 200,
        end: 1999,
        size: 1800,
      });
    });

    it("ignores an out-of-bounds start", () => {
      expect((service as any).calculateRange("bytes=2500-", 2000)).toEqual({
        start: 0,
        end: 1999,
        size: 2000,
      });
    });
  });

  describe("detectType", () => {
    it("returns WINDOWS_PORTABLE for (W_P)", async () => {
      await expect((service as any).detectType("Game (W_P).zip")).resolves.toBe(
        GameType.WINDOWS_PORTABLE,
      );
    });

    it("returns WINDOWS_SETUP for (W_S)", async () => {
      await expect((service as any).detectType("Game (W_S).zip")).resolves.toBe(
        GameType.WINDOWS_SETUP,
      );
    });

    it("returns LINUX_PORTABLE for (L_P)", async () => {
      await expect((service as any).detectType("Game (L_P).zip")).resolves.toBe(
        GameType.LINUX_PORTABLE,
      );
    });

    it("returns WINDOWS_SOFTWARE for (W_SW)", async () => {
      await expect(
        (service as any).detectType("Game (W_SW).zip"),
      ).resolves.toBe(GameType.WINDOWS_SOFTWARE);
    });

    it("returns LINUX_SOFTWARE for (L_SW)", async () => {
      await expect(
        (service as any).detectType("Game (L_SW).zip"),
      ).resolves.toBe(GameType.LINUX_SOFTWARE);
    });

    it("uses the MOCK_FILES failsafe", async () => {
      configuration.TESTING.MOCK_FILES = true;
      await expect((service as any).detectType("Game.zip")).resolves.toBe(
        GameType.WINDOWS_SETUP,
      );
    });

    it("detects .exe and .sh when not in mock mode", async () => {
      configuration.TESTING.MOCK_FILES = false;
      await expect((service as any).detectType("Game.exe")).resolves.toBe(
        GameType.WINDOWS_SETUP,
      );
      await expect((service as any).detectType("Game.sh")).resolves.toBe(
        GameType.LINUX_PORTABLE,
      );
      await expect((service as any).detectType("Game.AppImage")).resolves.toBe(
        GameType.LINUX_PORTABLE,
      );
      configuration.TESTING.MOCK_FILES = true;
    });
  });

  describe("pure parsers", () => {
    it("should extract the title from a file path", () => {
      expect((service as any).extractTitle("My Game (2023).zip")).toBe(
        "My Game",
      );
      expect((service as any).extractTitle("A (v1.0.0) (2023).zip")).toBe("A");
    });

    it("should extract the version from a file path", () => {
      expect((service as any).extractVersion("Game (v1.2.3).zip")).toBe(
        "v1.2.3",
      );
      expect((service as any).extractVersion("Game.zip")).toBeUndefined();
    });

    it("should extract a valid release year", () => {
      const date = (service as any).extractReleaseYear("Game (2023).zip");
      expect(date).toBeInstanceOf(Date);
      expect(date.getUTCFullYear()).toBe(2023);
      expect((service as any).extractReleaseYear("Game.zip")).toBeUndefined();
      expect(
        (service as any).extractReleaseYear("Game (abcd).zip"),
      ).toBeUndefined();
    });

    it("should extract the early access flag", () => {
      expect((service as any).extractEarlyAccessFlag("Game (EA).zip")).toBe(
        true,
      );
      expect((service as any).extractEarlyAccessFlag("Game.zip")).toBe(false);
    });

    it("should validate file paths", () => {
      expect((service as any).isValidFilePath("Game.zip")).toBe(true);
      expect((service as any).isValidFilePath("Game.txt")).toBe(false);
      expect((service as any).isValidFilePath("Game:Name.zip")).toBe(false);
    });

    it("should normalize versions from a legacy game", () => {
      const game = {
        id: 1,
        file_path: "/files/game.zip",
        version: "v1.0.0",
        size: 1000n,
        release_date: undefined,
        early_access: false,
        type: GameType.WINDOWS_SETUP,
        updated_at: undefined,
        created_at: new Date("2026-01-01"),
      } as any;
      const versions = (service as any).normalizeVersions(game);
      expect(versions).toHaveLength(1);
      expect(versions[0].file_path).toBe(game.file_path);

      const noPath = { id: 1, file_path: undefined } as any;
      expect((service as any).normalizeVersions(noPath)).toEqual([]);
    });

    it("should apply a version to a legacy game", () => {
      const game = {
        id: 1,
        file_path: "/files/game.zip",
        version: "v1.0.0",
        size: 1000n,
        release_date: undefined,
        early_access: false,
        type: GameType.WINDOWS_SETUP,
      } as any;
      (service as any).applyVersionToGame(game, {
        file_path: "/files/updated.zip",
        version: "v2.0.0",
        size: 1234,
        release_date: "2023-01-01",
        early_access: true,
        type: "WINDOWS_SETUP",
      });
      expect(game.file_path).toBe("/files/updated.zip");
      expect(game.version).toBe("v2.0.0");
      expect(game.size.toString()).toBe("1234");
      expect(game.early_access).toBe(true);
    });

    it("should detect windows installer executables", () => {
      expect(
        (service as any).detectWindowsSetupExecutable(["/a/setup.exe"]),
      ).toBe(true);
      expect(
        (service as any).detectWindowsSetupExecutable(["/a/install.msi"]),
      ).toBe(true);
      expect(
        (service as any).detectWindowsSetupExecutable(["/a/redist.msi"]),
      ).toBe(false);
      expect(
        (service as any).detectWindowsSetupExecutable(["/a/game.exe"]),
      ).toBe(false);
      expect((service as any).detectWindowsSetupExecutable([])).toBe(false);
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

  describe("index switch cases", () => {
    const makeService = () =>
      new FilesService(
        gamesService,
        metadataService,
        schedulerRegistry,
        gameVersionRepository as any,
      );

    it("handles EXISTS by upserting a version", async () => {
      const svc = makeService();
      gamesService.checkIfExistsInDatabase.mockResolvedValue([
        GameExistence.EXISTS,
        { id: 7 } as any,
      ]);
      vi.spyOn(svc as any, "detectType").mockResolvedValue(
        GameType.WINDOWS_SETUP,
      );
      const upsertSpy = vi
        .spyOn(svc as any, "upsertIndexedVersion")
        .mockResolvedValue("job");

      await (svc as any).index("/tmp/Game.zip", { size: 100 }, true);

      expect(upsertSpy).toHaveBeenCalledWith(7, expect.any(Object));
      expect(metadataService.addUpdateMetadataJob).toHaveBeenCalledWith("job");
    });

    it("handles DOES_NOT_EXIST by saving a new game", async () => {
      const svc = makeService();
      gamesService.checkIfExistsInDatabase.mockResolvedValue([
        GameExistence.DOES_NOT_EXIST,
        undefined,
      ]);
      gamesService.save.mockResolvedValue({ id: 8 } as any);
      vi.spyOn(svc as any, "detectType").mockResolvedValue(
        GameType.WINDOWS_SETUP,
      );
      const upsertSpy = vi
        .spyOn(svc as any, "upsertIndexedVersion")
        .mockResolvedValue("job");

      await (svc as any).index("/tmp/Game.zip", { size: 100 }, true);

      expect(gamesService.save).toHaveBeenCalled();
      expect(upsertSpy).toHaveBeenCalledWith(8, expect.any(Object));
    });

    it("handles EXISTS_BUT_DELETED_IN_DATABASE by restoring", async () => {
      const svc = makeService();
      gamesService.checkIfExistsInDatabase.mockResolvedValue([
        GameExistence.EXISTS_BUT_DELETED_IN_DATABASE,
        { id: 9 } as any,
      ]);
      gamesService.restore.mockResolvedValue({ id: 9 } as any);
      vi.spyOn(svc as any, "detectType").mockResolvedValue(
        GameType.WINDOWS_SETUP,
      );
      const upsertSpy = vi
        .spyOn(svc as any, "upsertIndexedVersion")
        .mockResolvedValue("job");

      await (svc as any).index("/tmp/Game.zip", { size: 100 }, true);

      expect(gamesService.restore).toHaveBeenCalledWith(9);
      expect(upsertSpy).toHaveBeenCalledWith(9, expect.any(Object));
    });

    it("handles EXISTS_BUT_ALTERED", async () => {
      const svc = makeService();
      gamesService.checkIfExistsInDatabase.mockResolvedValue([
        GameExistence.EXISTS_BUT_ALTERED,
        { id: 10 } as any,
      ]);
      vi.spyOn(svc as any, "detectType").mockResolvedValue(
        GameType.WINDOWS_SETUP,
      );
      const upsertSpy = vi
        .spyOn(svc as any, "upsertIndexedVersion")
        .mockResolvedValue("job");

      await (svc as any).index("/tmp/Game.zip", { size: 100 }, true);

      expect(upsertSpy).toHaveBeenCalledWith(10, expect.any(Object));
    });
  });

  describe("mergeDuplicateGames", () => {
    it("should merge games with the same normalized title and release year", async () => {
      const canonical = {
        id: 1,
        title: "The Roottrees are Dead",
        sort_title: "roottrees are dead",
        release_date: undefined,
        download_count: 5,
        file_path: "/tmp/test-files/A.7z",
      } as any;
      const duplicate = {
        id: 2,
        title: "The Roottrees Are Dead",
        sort_title: "roottrees are dead",
        release_date: undefined,
        download_count: 3,
        file_path: "/tmp/test-files/B.rar",
      } as any;

      gamesService.find.mockResolvedValueOnce([canonical, duplicate]);
      gameVersionRepository.find.mockResolvedValueOnce([
        { id: 20, game: { id: 2 }, file_path: "/tmp/test-files/B.rar" },
      ] as any);
      gamesService.findOneByGameIdOrFail.mockResolvedValueOnce(canonical);
      vi.spyOn(
        service as any,
        "listAvailableVersionsFromStorage",
      ).mockResolvedValue([
        { file_path: "/tmp/test-files/A.7z", indexed_at: new Date() },
        { file_path: "/tmp/test-files/B.rar", indexed_at: new Date() },
      ]);

      const merged = await service.mergeDuplicateGames();

      expect(merged).toBe(1);
      expect(gameVersionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ game: { id: 1 } }),
      );
      expect(gamesService.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 2,
          file_path: expect.stringContaining("merged:2:"),
        }),
      );
      expect(gamesService.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, download_count: 8 }),
      );
      expect(gamesService.delete).toHaveBeenCalledWith(2);
    });

    it("should not merge games that share a title but not the release year", async () => {
      gamesService.find.mockResolvedValueOnce([
        {
          id: 1,
          sort_title: "game",
          release_date: new Date("2001-01-01"),
          download_count: 0,
        },
        {
          id: 2,
          sort_title: "game",
          release_date: new Date("2021-01-01"),
          download_count: 0,
        },
      ] as any);

      const merged = await service.mergeDuplicateGames();

      expect(merged).toBe(0);
      expect(gamesService.delete).not.toHaveBeenCalled();
    });

    it("should do nothing when there are no duplicate titles", async () => {
      gamesService.find.mockResolvedValueOnce([
        { id: 1, sort_title: "alpha", download_count: 0 },
        { id: 2, sort_title: "beta", download_count: 0 },
      ] as any);

      await expect(service.mergeDuplicateGames()).resolves.toBe(0);
      expect(gamesService.delete).not.toHaveBeenCalled();
    });

    it("should migrate legacy games that have no normalized version rows", async () => {
      const canonical = {
        id: 1,
        sort_title: "game",
        file_path: "/tmp/test-files/A.zip",
        download_count: 0,
      } as any;
      const duplicate = {
        id: 2,
        sort_title: "game",
        file_path: "/tmp/test-files/B.zip",
        size: 10n,
        download_count: 0,
      } as any;

      gamesService.find.mockResolvedValueOnce([canonical, duplicate]);
      gameVersionRepository.find.mockResolvedValueOnce([]); // no version rows
      gamesService.findOneByGameIdOrFail.mockResolvedValueOnce(canonical);
      vi.spyOn(
        service as any,
        "listAvailableVersionsFromStorage",
      ).mockResolvedValue([
        { file_path: "/tmp/test-files/A.zip", indexed_at: new Date() },
        { file_path: "/tmp/test-files/B.zip", indexed_at: new Date() },
      ]);

      const merged = await service.mergeDuplicateGames();

      expect(merged).toBe(1);
      expect(gameVersionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          game: { id: 1 },
          file_path: "/tmp/test-files/B.zip",
        }),
      );
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

    it("should keep a version file that was indexed while the scan was running", async () => {
      configuration.TESTING.MOCK_FILES = false;

      gamesService.find.mockResolvedValueOnce([
        {
          id: 1294,
          file_path: "/tmp/test-files/Order of the Sinking Star.rar",
        },
      ] as any);

      gameVersionRepository.find
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            id: 501,
            game: { id: 1294 },
            file_path: "/tmp/test-files/Order of the Sinking Star.rar",
            version: "1.0",
            deleted_at: undefined,
          },
        ] as any);

      // The scan ran before the file was uploaded, so its snapshot is stale and
      // knows nothing about the version that the watcher just indexed.
      vi.spyOn(service as any, "readAllFiles").mockResolvedValueOnce([]);
      // The file is of course still in storage.
      fsExtra.pathExists.mockResolvedValue(true);

      await (service as any).checkIntegrity();

      expect(gameVersionRepository.softDelete).not.toHaveBeenCalled();
      expect(gamesService.delete).not.toHaveBeenCalled();
    });

    it("should still delete a game whose version file is gone from storage", async () => {
      configuration.TESTING.MOCK_FILES = false;

      gamesService.find.mockResolvedValueOnce([
        { id: 1294, file_path: "/tmp/test-files/ZED ZONE.rar" },
      ] as any);

      gameVersionRepository.find
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            id: 502,
            game: { id: 1294 },
            file_path: "/tmp/test-files/ZED ZONE.rar",
            version: "1.0",
            deleted_at: undefined,
          },
        ] as any);

      vi.spyOn(service as any, "readAllFiles").mockResolvedValueOnce([]);
      fsExtra.pathExists.mockImplementation(
        async (filePath: string) => filePath === "/tmp/test-files",
      );

      await (service as any).checkIntegrity();

      expect(gameVersionRepository.softDelete).toHaveBeenCalledWith([502]);
      expect(gamesService.delete).toHaveBeenCalledWith(1294);
    });

    it("should not delete the whole library when the files volume is unreachable", async () => {
      configuration.TESTING.MOCK_FILES = false;

      gamesService.find.mockResolvedValueOnce([
        { id: 1, file_path: "/tmp/test-files/Game.zip" },
      ] as any);

      vi.spyOn(service as any, "readAllFiles").mockResolvedValueOnce([]);
      // Neither the volume root nor any file is reachable.
      fsExtra.pathExists.mockResolvedValue(false);

      await (service as any).checkIntegrity();

      expect(gameVersionRepository.softDelete).not.toHaveBeenCalled();
      expect(gamesService.delete).not.toHaveBeenCalled();
    });

    it("should still delete version files that the scan configuration excludes", async () => {
      configuration.TESTING.MOCK_FILES = false;
      configuration.GAMES.SEARCH_EXCLUDE_FILE_REGEX = /\.rar$/;

      gamesService.find.mockResolvedValueOnce([
        { id: 1295, file_path: "/tmp/test-files/Excluded.rar" },
      ] as any);

      gameVersionRepository.find
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            id: 503,
            game: { id: 1295 },
            file_path: "/tmp/test-files/Excluded.rar",
            version: "1.0",
            deleted_at: undefined,
          },
        ] as any);

      vi.spyOn(service as any, "readAllFiles").mockResolvedValueOnce([]);
      // Present on disk, but the indexer no longer wants it in the library.
      fsExtra.pathExists.mockResolvedValue(true);

      await (service as any).checkIntegrity();

      expect(gamesService.delete).toHaveBeenCalledWith(1295);
    });

    it("should only soft-delete the versions that are really gone", async () => {
      configuration.TESTING.MOCK_FILES = false;

      gamesService.find.mockResolvedValueOnce([
        { id: 42, file_path: "/tmp/test-files/Kept.zip" },
      ] as any);

      gameVersionRepository.find
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            id: 1,
            game: { id: 42 },
            file_path: "/tmp/test-files/Kept.zip",
            version: "1.0",
            deleted_at: undefined,
          },
          {
            id: 2,
            game: { id: 42 },
            file_path: "/tmp/test-files/Uploaded While Scanning.rar",
            version: "1.1",
            deleted_at: undefined,
          },
          {
            id: 3,
            game: { id: 42 },
            file_path: "/tmp/test-files/Removed From Disk.zip",
            version: "1.2",
            deleted_at: undefined,
          },
        ] as any);

      vi.spyOn(service as any, "readAllFiles").mockResolvedValueOnce([
        { path: "/tmp/test-files/Kept.zip", size: 1 },
      ]);
      fsExtra.pathExists.mockImplementation(
        async (filePath: string) =>
          filePath === "/tmp/test-files" ||
          filePath.includes("Uploaded While Scanning"),
      );

      await (service as any).checkIntegrity();

      expect(gameVersionRepository.softDelete).toHaveBeenCalledWith([3]);
      expect(gamesService.delete).not.toHaveBeenCalled();
    });
  });

  describe("runScheduledIndex", () => {
    it("should not start a second scan while one is still running", async () => {
      const indexSpy = vi
        .spyOn(service, "indexAllFiles")
        .mockResolvedValue(undefined as any);
      (service as any).fullIndexInProgress = true;

      await (service as any).runScheduledIndex();

      expect(indexSpy).not.toHaveBeenCalled();
    });

    it("should start a scan when none is running", async () => {
      const indexSpy = vi
        .spyOn(service, "indexAllFiles")
        .mockResolvedValue(undefined as any);
      (service as any).fullIndexInProgress = false;

      await (service as any).runScheduledIndex();

      expect(indexSpy).toHaveBeenCalledTimes(1);
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

  describe("upsertIndexedVersion", () => {
    it("should preserve user-defined title and sort title when both are set", async () => {
      const game = {
        id: 9,
        file_path: "/tmp/test-files/Game (v2).zip",
        title: "My Game",
        sort_title: "my custom sort",
        download_count: 3,
        user_metadata: { id: 1, title: "My Game" },
      } as any;
      gamesService.findOneByGameIdOrFail.mockResolvedValue(game);

      await (service as any).upsertIndexedVersion(9, {
        file_path: "/tmp/test-files/Game (v2).zip",
        title: "Game (v2)",
        sort_title: "game (v2)",
      });

      const patch = gamesService.save.mock.calls.at(-1)?.[0];
      expect(patch!.title).toBeUndefined();
      expect(patch!.sort_title).toBeUndefined();
    });

    it("should keep a customized sort title even if only metadata without title exists", async () => {
      const game = {
        id: 9,
        file_path: "/tmp/test-files/Game (v2).zip",
        title: "My Game",
        sort_title: "my custom sort",
        download_count: 1,
        user_metadata: { id: 1 },
      } as any;
      gamesService.findOneByGameIdOrFail.mockResolvedValue(game);

      await (service as any).upsertIndexedVersion(9, {
        file_path: "/tmp/test-files/Game (v2).zip",
        title: "Game (v2)",
        sort_title: "game (v2)",
      });

      const patch = gamesService.save.mock.calls.at(-1)?.[0];
      expect(patch!.title).toBe("Game (v2)");
      expect(patch!.sort_title).toBeUndefined();
    });

    it("should derive title/sort title from the file when nothing was overridden", async () => {
      const game = {
        id: 9,
        file_path: "/tmp/test-files/Game (v2).zip",
        title: "Game",
        sort_title: "game",
        download_count: 0,
        user_metadata: { id: 1 },
      } as any;
      gamesService.findOneByGameIdOrFail.mockResolvedValue(game);

      await (service as any).upsertIndexedVersion(9, {
        file_path: "/tmp/test-files/Game (v2).zip",
        title: "Game (v2)",
        sort_title: "game (v2)",
      });

      const patch = gamesService.save.mock.calls.at(-1)?.[0];
      expect(patch!.title).toBe("Game (v2)");
      expect(patch!.sort_title).toBe("game (v2)");
    });

    it("should derive title/sort title from the file when no user metadata exists", async () => {
      const game = {
        id: 9,
        file_path: "/tmp/test-files/Game (v2).zip",
        title: "Game",
        sort_title: "game",
        download_count: 0,
        user_metadata: undefined,
      } as any;
      gamesService.findOneByGameIdOrFail.mockResolvedValue(game);

      await (service as any).upsertIndexedVersion(9, {
        file_path: "/tmp/test-files/Game (v2).zip",
        title: "Game (v2)",
        sort_title: "game (v2)",
      });

      const patch = gamesService.save.mock.calls.at(-1)?.[0];
      expect(patch!.title).toBe("Game (v2)");
      expect(patch!.sort_title).toBe("game (v2)");
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
