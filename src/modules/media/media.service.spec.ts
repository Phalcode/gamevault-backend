import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import configuration from "../../configuration.js";
import { GamevaultUser } from "../users/gamevault-user.entity.js";
import { UsersService } from "../users/users.service.js";
import { Media } from "./media.entity.js";
import { MediaService } from "./media.service.js";

// Mock configuration - must be before any imports that use it
vi.mock("../../configuration.js", () => ({
  __esModule: true,
  default: {
    VOLUMES: { MEDIA: "/media", LOGS: "/logs" },
    MEDIA: {
      MAX_SIZE: 10 * 1024 * 1024,
      SUPPORTED_FORMATS: [
        "image/jpeg",
        "image/png",
        "image/gif",
        "video/mp4",
        "audio/mpeg",
      ],
    },
    TESTING: { MOCK_FILES: true },
    SERVER: { LOG_LEVEL: "off", LOG_FILES_ENABLED: false },
  },
}));

// Mock logging module to avoid configuration dependency chain
vi.mock("../../logging.js", () => ({
  __esModule: true,
  default: { log: vi.fn(), error: vi.fn(), warn: vi.fn() },
  logMedia: vi.fn((m) => ({ id: m?.id, file_path: m?.file_path })),
  logGamevaultGame: vi.fn(),
  logGamevaultUser: vi.fn(),
  stream: { write: vi.fn() },
}));

// Mock file-type-checker
vi.mock("file-type-checker", () => ({
  __esModule: true,
  default: {
    detectFile: vi.fn(),
  },
}));

// Mock fs-extra
vi.mock("fs-extra", async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  const overrides = {
    pathExists: vi.fn().mockResolvedValue(true),
    remove: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
  };
  return {
    ...actual,
    ...overrides,
    default: { ...(actual as any).default, ...overrides },
  };
});

import fileTypeChecker from "file-type-checker";
import type { Mock, Mocked } from "vitest";

describe("MediaService", () => {
  let service: MediaService;
  let mediaRepository: Mocked<Repository<Media>>;
  let usersService: Mocked<UsersService>;

  const createMockMedia = (overrides: Partial<Media> = {}): Media => {
    const media = new Media();
    media.id = 1;
    media.type = "image/jpeg";
    media.file_path = "/media/test.jpg";
    Object.assign(media, overrides);
    return media;
  };

  beforeEach(() => {
    mediaRepository = {
      findOneByOrFail: vi.fn(),
      findOneOrFail: vi.fn(),
      save: vi.fn(),
      remove: vi.fn(),
    } as any;

    usersService = {
      findOneByUsernameOrFail: vi.fn(),
    } as any;

    service = new MediaService(
      mediaRepository,
      usersService,
      configuration as any,
    );
  });

  describe("isAvailable", () => {
    it("should return true when media exists", async () => {
      mediaRepository.findOneByOrFail.mockResolvedValue(createMockMedia());
      const result = await service.isAvailable(1);
      expect(result).toBe(true);
    });

    it("should return false when media does not exist", async () => {
      mediaRepository.findOneByOrFail.mockRejectedValue(new Error("Not found"));
      const result = await service.isAvailable(999);
      expect(result).toBe(false);
    });

    it("should return false when id is null", async () => {
      const result = await service.isAvailable(null);
      expect(result).toBe(false);
    });

    it("should return false when id is 0", async () => {
      const result = await service.isAvailable(0);
      expect(result).toBe(false);
    });
  });

  describe("findOneByMediaIdOrFail", () => {
    it("should return media when found", async () => {
      const mockMedia = createMockMedia();
      mediaRepository.findOneByOrFail.mockResolvedValue(mockMedia);
      const result = await service.findOneByMediaIdOrFail(1);
      expect(result).toEqual(mockMedia);
    });

    it("should throw NotFoundException when not found", async () => {
      mediaRepository.findOneByOrFail.mockRejectedValue(new Error("Not found"));
      await expect(service.findOneByMediaIdOrFail(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("upload", () => {
    it("should upload a valid media file", async () => {
      const mockUser = new GamevaultUser();
      mockUser.username = "testuser";
      usersService.findOneByUsernameOrFail.mockResolvedValue(mockUser);

      (fileTypeChecker.detectFile as Mock).mockReturnValue({
        extension: "jpg",
        mimeType: "image/jpeg",
      });

      mediaRepository.save.mockImplementation(
        async (media) =>
          ({
            ...media,
            id: 1,
          }) as any,
      );

      const file = {
        buffer: Buffer.from("fake image content"),
        originalname: "test.jpg",
        mimetype: "image/jpeg",
        size: 1024,
      } as Express.Multer.File;

      const result = await service.upload(file, "testuser");
      expect(result).toBeDefined();
      expect(result.type).toBe("image/jpeg");
    });

    it("should throw BadRequestException for unsupported file type", async () => {
      const mockUser = new GamevaultUser();
      usersService.findOneByUsernameOrFail.mockResolvedValue(mockUser);

      (fileTypeChecker.detectFile as Mock).mockReturnValue({
        extension: "exe",
        mimeType: "application/x-executable",
      });

      const file = {
        buffer: Buffer.from("fake exe content"),
        originalname: "test.exe",
        mimetype: "application/octet-stream",
        size: 1024,
      } as Express.Multer.File;

      await expect(service.upload(file, "testuser")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw BadRequestException when file type cannot be detected", async () => {
      const mockUser = new GamevaultUser();
      usersService.findOneByUsernameOrFail.mockResolvedValue(mockUser);

      (fileTypeChecker.detectFile as Mock).mockReturnValue({
        extension: undefined,
        mimeType: undefined,
      });

      const file = {
        buffer: Buffer.from("unknown content"),
        originalname: "unknown",
        mimetype: "application/octet-stream",
        size: 1024,
      } as Express.Multer.File;

      await expect(service.upload(file, "testuser")).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("delete", () => {
    it("should delete media (mocked files mode)", async () => {
      const media = createMockMedia();
      // In test mode with TESTING.MOCK_FILES = true, it just logs a warning
      await service.delete(media);
      // Should not throw
    });
  });
});
