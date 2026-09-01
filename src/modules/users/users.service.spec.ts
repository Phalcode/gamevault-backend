import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import type { Mocked } from "vitest";
import configuration from "../../configuration.js";
import { GamesService } from "../games/games.service.js";
import { MediaService } from "../media/media.service.js";
import { GamevaultUser } from "./gamevault-user.entity.js";
import { Role } from "./models/role.enum.js";
import { UsersService } from "./users.service.js";

describe("UsersService", () => {
  let service: UsersService;
  let userRepository: Mocked<Repository<GamevaultUser>>;
  let mediaService: Mocked<MediaService>;
  let gamesService: Mocked<GamesService>;

  const createMockUser = (
    overrides: Partial<GamevaultUser> = {},
  ): GamevaultUser => {
    const user = new GamevaultUser();
    user.id = 1;
    user.username = "testuser";
    user.password = "hashedpassword";
    user.email = "test@example.com";
    user.activated = true;
    user.role = Role.USER;
    user.progresses = [];
    user.bookmarked_games = [];
    Object.assign(user, overrides);
    return user;
  };

  beforeEach(() => {
    userRepository = {
      findOneOrFail: vi.fn(),
      findOne: vi.fn(),
      find: vi.fn(),
      save: vi.fn(),
      softRemove: vi.fn(),
      recover: vi.fn(),
      count: vi.fn(),
      createQueryBuilder: vi.fn(),
    } as any;

    mediaService = {
      findOneByMediaIdOrFail: vi.fn(),
    } as any;

    gamesService = {
      findOneByGameIdOrFail: vi.fn(),
    } as any;

    const testConfiguration = {
      ...configuration,
      TESTING: {
        ...configuration.TESTING,
        AUTHENTICATION_DISABLED: false,
      },
    };

    service = new UsersService(
      userRepository,
      mediaService,
      gamesService,
      testConfiguration as any,
    );
  });

  describe("calculateAge", () => {
    it("should return correct age for a past birth date", () => {
      const birthDate = new Date("1990-01-15");
      const age = service.calculateAge(birthDate);
      const expectedAge = new Date().getFullYear() - 1990;
      // Account for whether birthday has passed this year
      const today = new Date();
      const hasBirthdayPassed =
        today.getMonth() > 0 ||
        (today.getMonth() === 0 && today.getDate() >= 15);
      expect(age).toBe(hasBirthdayPassed ? expectedAge : expectedAge - 1);
    });

    it("should return 0 for null birth date", () => {
      expect(service.calculateAge(null as unknown as Date)).toBe(0);
    });

    it("should return 0 for undefined birth date", () => {
      expect(service.calculateAge(undefined as unknown as Date)).toBe(0);
    });

    it("should return 0 for a birth date today", () => {
      const today = new Date();
      expect(service.calculateAge(today)).toBe(0);
    });

    it("should handle birth date exactly one year ago", () => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      expect(service.calculateAge(oneYearAgo)).toBe(1);
    });

    it("should handle future birth date", () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      expect(service.calculateAge(futureDate)).toBe(-1);
    });
  });

  describe("findOneByUserIdOrFail", () => {
    it("should return user when found", async () => {
      const mockUser = createMockUser();
      userRepository.findOneOrFail.mockResolvedValue(mockUser);
      const result = await service.findOneByUserIdOrFail(1);
      expect(result).toEqual(mockUser);
    });

    it("should throw NotFoundException when user not found", async () => {
      userRepository.findOneOrFail.mockRejectedValue(new Error("Not found"));
      await expect(service.findOneByUserIdOrFail(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should load relations by default", async () => {
      const mockUser = createMockUser();
      userRepository.findOneOrFail.mockResolvedValue(mockUser);
      await service.findOneByUserIdOrFail(1);
      expect(userRepository.findOneOrFail).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: expect.objectContaining({
            progresses: { game: { metadata: { cover: true } } },
          }),
        }),
      );
    });

    it("should not load relations when disabled", async () => {
      const mockUser = createMockUser();
      userRepository.findOneOrFail.mockResolvedValue(mockUser);
      await service.findOneByUserIdOrFail(1, {
        loadRelations: false,
        loadDeletedEntities: false,
      });
      expect(userRepository.findOneOrFail).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: undefined,
        }),
      );
    });

    it("should filter deleted progresses", async () => {
      const mockUser = createMockUser({
        progresses: [
          { id: 1, deleted_at: null } as any,
          { id: 2, deleted_at: new Date() } as any,
        ],
      });
      userRepository.findOneOrFail.mockResolvedValue(mockUser);
      const result = await service.findOneByUserIdOrFail(1);
      expect(result.progresses!).toHaveLength(1);
      expect(result.progresses![0].id).toBe(1);
    });
  });

  describe("findOneByUsernameOrFail", () => {
    it("should return user when found", async () => {
      const mockUser = createMockUser();
      userRepository.findOneOrFail.mockResolvedValue(mockUser);
      const result = await service.findOneByUsernameOrFail("testuser");
      expect(result).toEqual(mockUser);
    });

    it("should throw NotFoundException when user not found", async () => {
      userRepository.findOneOrFail.mockRejectedValue(new Error("Not found"));
      await expect(
        service.findOneByUsernameOrFail("nonexistent"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("find", () => {
    it("should return all users including hidden when flag is true", async () => {
      const users = [
        createMockUser(),
        createMockUser({ id: 2, username: "user2" }),
      ];
      userRepository.find.mockResolvedValue(users);
      const result = await service.find(true);
      expect(result).toEqual(users);
      expect(userRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ withDeleted: true }),
      );
    });

    it("should exclude hidden users when flag is false", async () => {
      const users = [createMockUser()];
      userRepository.find.mockResolvedValue(users);
      const result = await service.find(false);
      expect(result).toEqual(users);
      expect(userRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ withDeleted: false }),
      );
    });
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      userRepository.findOne.mockResolvedValue(null); // No existing user
      userRepository.count.mockResolvedValue(1); // Not the first user
      userRepository.save.mockImplementation(async (user) => {
        return { ...user, id: 1, created_at: new Date() } as any;
      });

      const dto = {
        username: "newuser",
        password: "password123",
        email: "new@example.com",
      };
      const result = await service.register(dto as any);
      expect(result.username).toBe("newuser");
      expect(result.password).toBe("**REDACTED**");
      expect(result.api_key).toBe("**REDACTED**");
    });

    it("should set first user as admin", async () => {
      userRepository.findOne.mockResolvedValue(null);
      userRepository.count.mockResolvedValue(0); // First user
      userRepository.save.mockImplementation(async (user) => {
        return { ...user, id: 1 } as any;
      });

      const dto = { username: "admin", password: "password123" };
      const result = await service.register(dto as any);
      expect(result.role).toBe(Role.ADMIN);
      expect(result.activated).toBe(true);
    });

    it("should throw ForbiddenException for duplicate username", async () => {
      const existing = createMockUser();
      userRepository.findOne.mockResolvedValue(existing);
      const dto = { username: "testuser", password: "password123" };
      await expect(service.register(dto as any)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe("delete", () => {
    it("should soft delete a user", async () => {
      const mockUser = createMockUser();
      userRepository.findOneOrFail.mockResolvedValue(mockUser);
      userRepository.softRemove.mockResolvedValue({
        ...mockUser,
        deleted_at: new Date(),
      });
      const result = await service.delete(1);
      expect(result.deleted_at).toBeDefined();
    });
  });

  describe("recover", () => {
    it("should recover a deleted user", async () => {
      const mockUser = createMockUser({ deleted_at: new Date() });
      userRepository.findOneOrFail.mockResolvedValue(mockUser);
      userRepository.recover.mockResolvedValue({
        ...mockUser,
        deleted_at: undefined,
      });
      const result = await service.recover(1);
      expect(result.deleted_at).toBeUndefined();
    });
  });

  describe("cleanConfidentialUser", () => {
    it("should remove password and api_key", () => {
      const user = createMockUser({ api_key: "secretkey" });
      const result = service.cleanConfidentialUser(user);
      expect(result.password).toBeUndefined();
      expect(result.api_key).toBeUndefined();
    });
  });

  describe("update", () => {
    it("should update username", async () => {
      const mockUser = createMockUser();
      userRepository.findOneOrFail.mockResolvedValue(mockUser);
      userRepository.findOne.mockResolvedValue(null); // No duplicate
      userRepository.save.mockImplementation(async (user) => user as any);

      const result = await service.update(1, { username: "newname" } as any);
      expect(result.username).toBe("newname");
    });

    it("should update role when isAdmin is true", async () => {
      const mockUser = createMockUser();
      userRepository.findOneOrFail.mockResolvedValue(mockUser);
      userRepository.save.mockImplementation(async (user) => user as any);

      const result = await service.update(1, { role: Role.ADMIN } as any, true);
      expect(result.role).toBe(Role.ADMIN);
    });

    it("should not update role when isAdmin is false", async () => {
      const mockUser = createMockUser();
      userRepository.findOneOrFail.mockResolvedValue(mockUser);
      userRepository.save.mockImplementation(async (user) => user as any);

      const result = await service.update(
        1,
        { role: Role.ADMIN } as any,
        false,
      );
      expect(result.role).toBe(Role.USER);
    });

    it("should update activated when isAdmin is true", async () => {
      const mockUser = createMockUser({ activated: false });
      userRepository.findOneOrFail.mockResolvedValue(mockUser);
      userRepository.save.mockImplementation(async (user) => user as any);

      const result = await service.update(1, { activated: true } as any, true);
      expect(result.activated).toBe(true);
    });
  });

  describe("bookmarkGame", () => {
    it("should bookmark a game for a user", async () => {
      const mockUser = createMockUser({ bookmarked_games: [] });
      const mockGame = { id: 5, title: "Test Game" } as any;
      userRepository.findOneOrFail.mockResolvedValue(mockUser);
      gamesService.findOneByGameIdOrFail.mockResolvedValue(mockGame);
      const mockQb = {
        relation: vi.fn().mockReturnThis(),
        of: vi.fn().mockReturnThis(),
        add: vi.fn().mockResolvedValue(undefined),
      };
      userRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      const result = await service.bookmarkGame(1, 5);
      expect(result.bookmarked_games).toContainEqual(mockGame);
    });

    it("should not duplicate bookmark if already bookmarked", async () => {
      const mockGame = { id: 5, title: "Test Game" } as any;
      const mockUser = createMockUser({ bookmarked_games: [mockGame] });
      userRepository.findOneOrFail.mockResolvedValue(mockUser);

      const result = await service.bookmarkGame(1, 5);
      expect(result.bookmarked_games).toHaveLength(1);
    });
  });

  describe("unbookmarkGame", () => {
    it("should unbookmark a game for a user", async () => {
      const mockGame = { id: 5, title: "Test Game" } as any;
      const mockUser = createMockUser({ bookmarked_games: [mockGame] });
      userRepository.findOneOrFail.mockResolvedValue(mockUser);
      gamesService.findOneByGameIdOrFail.mockResolvedValue(mockGame);
      const mockQb = {
        relation: vi.fn().mockReturnThis(),
        of: vi.fn().mockReturnThis(),
        remove: vi.fn().mockResolvedValue(undefined),
      };
      userRepository.createQueryBuilder.mockReturnValue(mockQb as any);

      const result = await service.unbookmarkGame(1, 5);
      expect(result.bookmarked_games).toHaveLength(0);
    });

    it("should do nothing if game is not bookmarked", async () => {
      const mockUser = createMockUser({ bookmarked_games: [] });
      userRepository.findOneOrFail.mockResolvedValue(mockUser);

      const result = await service.unbookmarkGame(1, 5);
      expect(result.bookmarked_games).toHaveLength(0);
    });
  });

  describe("checkIfUsernameMatchesIdOrIsAdminOrThrow", () => {
    it("should allow an admin executor to modify any user's data", async () => {
      vi.spyOn(service, "checkIfUsernameIsAtLeastRole").mockResolvedValue(true);
      const result = await service.checkIfUsernameMatchesIdOrIsAdminOrThrow(
        1,
        "adminuser",
      );
      expect(result).toBe(true);
    });

    it("should return true when username matches", async () => {
      vi.spyOn(service, "checkIfUsernameIsAtLeastRole").mockResolvedValue(
        false,
      );
      const user = createMockUser({ username: "testuser" });
      userRepository.findOneOrFail.mockResolvedValue(user);
      const result = await service.checkIfUsernameMatchesIdOrIsAdminOrThrow(
        1,
        "testuser",
      );
      expect(result).toBe(true);
    });

    it("should throw ForbiddenException for mismatched non-admin user", async () => {
      vi.spyOn(service, "checkIfUsernameIsAtLeastRole").mockResolvedValue(
        false,
      );
      const user = createMockUser({ username: "testuser", role: Role.USER });
      userRepository.findOneOrFail.mockResolvedValue(user);
      await expect(
        service.checkIfUsernameMatchesIdOrIsAdminOrThrow(1, "otheruser"),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("findUserForAuthOrFail", () => {
    it("should return user for valid credentials", async () => {
      const mockUser = createMockUser({
        activated: true,
        deleted_at: undefined,
      });
      userRepository.findOneOrFail.mockResolvedValue(mockUser);
      const result = await service.findUserForAuthOrFail({
        username: "testuser",
      });
      expect(result.username).toBe("testuser");
    });

    it("should throw UnauthorizedException for deleted user", async () => {
      const mockUser = createMockUser({ deleted_at: new Date() });
      userRepository.findOneOrFail.mockResolvedValue(mockUser);
      await expect(
        service.findUserForAuthOrFail({ username: "testuser" }),
      ).rejects.toThrow("Authentication Failed: User has been deleted");
    });

    it("should throw NotAcceptableException for inactive non-admin user", async () => {
      const mockUser = createMockUser({
        activated: false,
        role: Role.USER,
        deleted_at: undefined,
      });
      userRepository.findOneOrFail.mockResolvedValue(mockUser);
      await expect(
        service.findUserForAuthOrFail({ username: "testuser" }),
      ).rejects.toThrow("Authorization Failed: User is not activated");
    });
  });
});
