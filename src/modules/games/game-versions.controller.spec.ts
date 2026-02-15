import { OtpService } from "../otp/otp.service";
import { GamevaultUser } from "../users/gamevault-user.entity";
import { Role } from "../users/models/role.enum";
import { UsersService } from "../users/users.service";
import { FilesService } from "./files.service";
import { GameVersionsController } from "./game-versions.controller";

describe("GameVersionsController", () => {
  let controller: GameVersionsController;
  let filesService: jest.Mocked<FilesService>;
  let usersService: jest.Mocked<UsersService>;
  let otpService: jest.Mocked<OtpService>;

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
      download: jest.fn(),
      deleteGameFile: jest.fn(),
    } as any;

    usersService = {
      findUserAgeByUsername: jest.fn().mockResolvedValue(undefined),
    } as any;

    otpService = {
      create: jest.fn().mockReturnValue("mock-otp"),
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
      const mockResponse = { setHeader: jest.fn() } as any;
      filesService.download.mockResolvedValue({} as any);

      await controller.downloadGameVersion(
        { user: mockUser },
        42,
        7,
        mockResponse,
        "1024",
        "bytes=0-999",
      );

      expect(otpService.create).toHaveBeenCalledWith("testuser", 42, 1024);
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
