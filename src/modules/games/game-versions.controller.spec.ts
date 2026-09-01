import type { Mocked } from "vitest";
import { OtpService } from "../otp/otp.service.js";
import { GamevaultUser } from "../users/gamevault-user.entity.js";
import { Role } from "../users/models/role.enum.js";
import { UsersService } from "../users/users.service.js";
import { FilesService } from "./files.service.js";
import { GameVersionsController } from "./game-versions.controller.js";

describe("GameVersionsController", () => {
  let controller: GameVersionsController;
  let filesService: Mocked<FilesService>;
  let usersService: Mocked<UsersService>;
  let otpService: Mocked<OtpService>;

  const createMockUser = (
    overrides: Partial<GamevaultUser> = {},
  ): GamevaultUser => {
    const user = new GamevaultUser();
    user.id = 1;
    user.username = "testuser";
    user.role = Role.USER;
    Object.assign(user, overrides);
    return user;
  };

  beforeEach(() => {
    filesService = {
      download: vi.fn(),
      deleteGameFile: vi.fn(),
    } as any;

    usersService = {
      findUserAgeByUsername: vi.fn().mockResolvedValue(undefined),
    } as any;

    otpService = {
      create: vi.fn().mockReturnValue("mock-otp"),
    } as any;

    controller = new GameVersionsController(
      filesService,
      usersService,
      otpService,
    );
  });

  describe("deleteGameVersion", () => {
    it("should delete a specific version by ids", async () => {
      filesService.deleteGameFile.mockResolvedValue(undefined);

      await controller.deleteGameVersion(42, 7);

      expect(filesService.deleteGameFile).toHaveBeenCalledWith(42, 7);
    });
  });

  describe("downloadGameVersion", () => {
    it("should download a specific version and set OTP header", async () => {
      const mockUser = createMockUser();
      const mockResponse = { setHeader: vi.fn() } as any;
      filesService.download.mockResolvedValue({} as any);

      await controller.downloadGameVersion(
        { user: mockUser },
        42,
        7,
        mockResponse,
        "1024",
        "bytes=0-999",
      );

      expect(otpService.create).toHaveBeenCalledWith("testuser", 42, 7, 1024);
      expect(mockResponse.setHeader).toHaveBeenCalledWith("X-Otp", "mock-otp");
      expect(filesService.download).toHaveBeenCalledWith(
        mockResponse,
        42,
        7,
        1024,
        "bytes=0-999",
        undefined,
      );
    });
  });
});
