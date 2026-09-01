import { BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Repository } from "typeorm";
import type { Mocked } from "vitest";
import configuration from "../../configuration.js";
import { GamevaultUser } from "../users/gamevault-user.entity.js";
import { Role } from "../users/models/role.enum.js";
import { UsersService } from "../users/users.service.js";
import { AuthenticationService } from "./authentication.service.js";
import { Session } from "./session.entity.js";

describe("AuthenticationService", () => {
  let service: AuthenticationService;
  let usersService: Mocked<UsersService>;
  let jwtService: Mocked<JwtService>;
  let sessionRepository: Mocked<Repository<Session>>;

  const createMockUser = (
    overrides: Partial<GamevaultUser> = {},
  ): GamevaultUser => {
    const user = new GamevaultUser();
    user.id = 1;
    user.username = "testuser";
    user.email = "test@example.com";
    user.first_name = "Test";
    user.last_name = "User";
    user.role = Role.USER;
    user.activated = true;
    Object.assign(user, overrides);
    return user;
  };

  beforeEach(() => {
    usersService = {
      findOneByUsernameOrFail: vi.fn(),
      register: vi.fn(),
    } as any;

    jwtService = {
      sign: vi.fn().mockReturnValue("mock-jwt-token"),
    } as any;

    sessionRepository = {
      save: vi.fn().mockImplementation(async (s) => ({ ...s, id: 1 })),
      findOne: vi.fn(),
      find: vi.fn(),
      delete: vi.fn().mockResolvedValue({ affected: 0 }),
      update: vi.fn().mockResolvedValue({ affected: 0 }),
    } as any;

    service = new AuthenticationService(
      usersService,
      jwtService,
      sessionRepository,
      configuration,
    );
  });

  describe("login", () => {
    it("should return access and refresh tokens on successful login", async () => {
      const mockUser = createMockUser();
      usersService.findOneByUsernameOrFail.mockResolvedValue(mockUser);
      jwtService.sign
        .mockReturnValueOnce("mock-refresh-token")
        .mockReturnValueOnce("mock-access-token");

      const result = await service.login(mockUser, "127.0.0.1", "Test Agent");
      expect(result).toHaveProperty("access_token");
      expect(result).toHaveProperty("refresh_token");
      expect(sessionRepository.save).toHaveBeenCalled();
    });

    it("should create a session with correct metadata", async () => {
      const mockUser = createMockUser();
      usersService.findOneByUsernameOrFail.mockResolvedValue(mockUser);

      await service.login(mockUser, "192.168.1.1", "Chrome/91");
      expect(sessionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockUser,
          ip_address: "192.168.1.1",
          user_agent: "Chrome/91",
        }),
      );
    });
  });

  describe("refresh", () => {
    it("should return new tokens on valid refresh", async () => {
      const mockUser = createMockUser();
      const mockSession = {
        id: 1,
        user: mockUser,
        revoked: false,
        expires_at: new Date(Date.now() + 86400000),
      } as Session;

      sessionRepository.findOne.mockResolvedValue(mockSession);
      sessionRepository.save.mockImplementation(async (s) => s as any);

      jwtService.sign
        .mockReturnValueOnce("new-refresh-token")
        .mockReturnValueOnce("new-access-token");

      const result = await service.refresh(
        mockUser,
        "127.0.0.1",
        "Test Agent",
        "old-refresh-token",
      );
      expect(result).toHaveProperty("access_token");
      expect(result).toHaveProperty("refresh_token");
    });

    it("should throw BadRequestException for invalid refresh token", async () => {
      const mockUser = createMockUser();
      sessionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.refresh(mockUser, "127.0.0.1", "Test Agent", "invalid-token"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("register", () => {
    it("should delegate to usersService.register", async () => {
      const dto = { username: "newuser", password: "password123" } as any;
      const mockUser = createMockUser({ username: "newuser" });
      usersService.register.mockResolvedValue(mockUser);

      const result = await service.register(dto);
      expect(result.username).toBe("newuser");
      expect(usersService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe("revoke", () => {
    it("should revoke an existing session", async () => {
      const mockSession = {
        id: 1,
        revoked: false,
        refresh_token_hash: "somehash",
      } as Session;
      sessionRepository.findOne.mockResolvedValue(mockSession);
      sessionRepository.save.mockImplementation(async (s) => s as any);

      await service.revoke({ refresh_token: "valid-refresh-token" });
      expect(sessionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ revoked: true }),
      );
    });

    it("should throw BadRequestException if no token provided", async () => {
      await expect(
        service.revoke({ refresh_token: undefined }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should handle revoking non-existent session gracefully", async () => {
      sessionRepository.findOne.mockResolvedValue(null);
      await service.revoke({ refresh_token: "nonexistent-token" });
      // No session found, so no save should happen.
      expect(sessionRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("isTokenRevoked", () => {
    it("should return false for valid non-revoked token", async () => {
      const mockSession = {
        id: 1,
        revoked: false,
        expires_at: new Date(Date.now() + 86400000),
      } as Session;
      sessionRepository.findOne.mockResolvedValue(mockSession);

      const result = await service.isTokenRevoked("valid-token");
      expect(result).toBe(false);
    });

    it("should return true for revoked token", async () => {
      sessionRepository.findOne.mockResolvedValue(null);

      const result = await service.isTokenRevoked("revoked-token");
      expect(result).toBe(true);
    });
  });

  describe("getUserSessions", () => {
    it("should return active sessions for a user", async () => {
      const mockUser = createMockUser();
      const sessions = [
        { id: 1, revoked: false, expires_at: new Date(Date.now() + 86400000) },
        { id: 2, revoked: false, expires_at: new Date(Date.now() + 86400000) },
      ] as Session[];
      sessionRepository.find.mockResolvedValue(sessions);

      const result = await service.getUserSessions(mockUser);
      expect(result).toHaveLength(2);
    });
  });

  describe("revokeAllUserSessions", () => {
    it("should revoke all sessions for a user", async () => {
      const mockUser = createMockUser();
      await service.revokeAllUserSessions(mockUser);
      expect(sessionRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          user: { id: mockUser.id },
          revoked: false,
        }),
        { revoked: true },
      );
    });
  });
});
