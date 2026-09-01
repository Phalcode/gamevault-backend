import { BadRequestException } from "@nestjs/common";
import configuration from "../../configuration.js";

import fileTypeCheckerMock from "file-type-checker";
import { SavefileService } from "./savefile.service.js";

vi.mock("../../configuration.js", () => ({
  __esModule: true,
  default: {
    TESTING: { MOCK_FILES: true },
    VOLUMES: { SAVEFILES: "/savefiles" },
    SAVEFILES: { MAX_SAVES: 5 },
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

// Mock file-type-checker
vi.mock("file-type-checker", () => ({
  __esModule: true,
  default: {
    detectFile: vi.fn(),
  },
}));

describe("SavefileService", () => {
  let service: SavefileService;
  let mockUsersService: any;
  let fileTypeChecker: any;

  beforeEach(() => {
    mockUsersService = {
      checkIfUsernameMatchesIdOrIsAdminOrThrow: vi
        .fn()
        .mockResolvedValue(undefined),
    };

    service = new SavefileService(mockUsersService, configuration as any);
    fileTypeChecker = fileTypeCheckerMock as any;
  });

  afterEach(() => vi.restoreAllMocks());

  // ─── generateNewPath ───────────────────────────────────────────────

  describe("generateNewPath", () => {
    it("should generate a path using userId, gameId, and installationId", () => {
      const path = (service as any).generateNewPath(
        1,
        42,
        "aaaa-bbbb-cccc-dddd",
      );
      expect(path).toMatch(
        /^\/savefiles\/users\/1\/games\/42\/\d+_aaaa-bbbb-cccc-dddd\.zip$/,
      );
    });

    it("should use random UUID when installationId not provided", () => {
      const path = (service as any).generateNewPath(1, 42);
      expect(path).toMatch(
        /^\/savefiles\/users\/1\/games\/42\/\d+_[0-9a-f-]+\.zip$/,
      );
    });
  });

  // ─── validate ──────────────────────────────────────────────────────

  describe("validate", () => {
    it("should accept valid ZIP files", async () => {
      fileTypeChecker.detectFile.mockReturnValue({
        extension: "zip",
        mimeType: "application/zip",
      });

      await expect(
        (service as any).validate(Buffer.from("PK\x03\x04")),
      ).resolves.not.toThrow();
    });

    it("should reject non-ZIP files", async () => {
      fileTypeChecker.detectFile.mockReturnValue({
        extension: "png",
        mimeType: "image/png",
      });

      await expect(
        (service as any).validate(Buffer.from("PNG header")),
      ).rejects.toThrow(BadRequestException);
    });

    it("should reject files with undetectable type", async () => {
      fileTypeChecker.detectFile.mockReturnValue(null);

      await expect(
        (service as any).validate(Buffer.from("random")),
      ).rejects.toThrow(BadRequestException);
    });

    it("should reject files with no extension", async () => {
      fileTypeChecker.detectFile.mockReturnValue({
        extension: null,
        mimeType: null,
      });

      await expect(
        (service as any).validate(Buffer.from("unknown")),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── upload ────────────────────────────────────────────────────────

  describe("upload", () => {
    it("should validate user permissions before saving", async () => {
      fileTypeChecker.detectFile.mockReturnValue({
        extension: "zip",
        mimeType: "application/zip",
      });

      await service.upload(
        1,
        42,
        { buffer: Buffer.from("PK\x03\x04") } as any,
        "testuser",
      );

      expect(
        mockUsersService.checkIfUsernameMatchesIdOrIsAdminOrThrow,
      ).toHaveBeenCalledWith(1, "testuser");
    });

    it("should reject invalid installation ID", async () => {
      fileTypeChecker.detectFile.mockReturnValue({
        extension: "zip",
        mimeType: "application/zip",
      });

      await expect(
        service.upload(
          1,
          42,
          { buffer: Buffer.from("PK\x03\x04") } as any,
          "testuser",
          "not-a-uuid",
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── delete ────────────────────────────────────────────────────────

  describe("delete", () => {
    it("should skip filesystem deletion when MOCK_FILES is true", async () => {
      await service.delete(1, 42, "testuser");
      // Should not throw since MOCK_FILES is true
    });
  });

  // ─── download ──────────────────────────────────────────────────────

  describe("download", () => {
    it("should check user permissions", async () => {
      // findSavefilesByUserIdAndGameIdOrFail will return [] because MOCK_FILES=true
      // causing NotFoundException
      await expect(service.download(1, 42, "testuser")).rejects.toThrow();

      expect(
        mockUsersService.checkIfUsernameMatchesIdOrIsAdminOrThrow,
      ).toHaveBeenCalledWith(1, "testuser");
    });
  });
});
