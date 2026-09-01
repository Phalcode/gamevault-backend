import type { Mocked } from "vitest";
import { ApiKeyService } from "./api-key.service.js";
import { GamevaultUser } from "./gamevault-user.entity.js";
import { Role } from "./models/role.enum.js";
import { UsersController } from "./users.controller.js";
import { UsersService } from "./users.service.js";

describe("UsersController", () => {
  let controller: UsersController;
  let usersService: Mocked<UsersService>;
  let apiKeyService: Mocked<ApiKeyService>;

  const createMockUser = (
    overrides: Partial<GamevaultUser> = {},
  ): GamevaultUser => {
    const user = new GamevaultUser();
    user.id = 1;
    user.username = "testuser";
    user.role = Role.USER;
    user.activated = true;
    Object.assign(user, overrides);
    return user;
  };

  beforeEach(() => {
    usersService = {
      find: vi.fn(),
      findOneByUserIdOrFail: vi.fn(),
      findOneByUsernameOrFail: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      recover: vi.fn(),
      bookmarkGame: vi.fn(),
      unbookmarkGame: vi.fn(),
    } as any;

    apiKeyService = {
      findApiKeyOrFail: vi.fn(),
    } as any;

    controller = new UsersController(usersService, apiKeyService);
  });

  describe("getUsers", () => {
    it("should include hidden users for admins", async () => {
      const adminUser = createMockUser({ role: Role.ADMIN });
      usersService.find.mockResolvedValue([createMockUser()]);

      await controller.getUsers({ user: adminUser });
      expect(usersService.find).toHaveBeenCalledWith(true);
    });

    it("should exclude hidden users for non-admins", async () => {
      const regularUser = createMockUser({ role: Role.USER });
      usersService.find.mockResolvedValue([createMockUser()]);

      await controller.getUsers({ user: regularUser });
      expect(usersService.find).toHaveBeenCalledWith(false);
    });

    it("should exclude hidden users for guests", async () => {
      const guestUser = createMockUser({ role: Role.GUEST });
      usersService.find.mockResolvedValue([createMockUser()]);

      await controller.getUsers({ user: guestUser });
      expect(usersService.find).toHaveBeenCalledWith(false);
    });
  });

  describe("getUserByUserId", () => {
    it("should return user details by ID", async () => {
      const mockUser = createMockUser();
      const requestUser = createMockUser({ id: 2 });
      usersService.findOneByUserIdOrFail.mockResolvedValue(mockUser);

      const result = await controller.getUserByUserId(
        { user_id: 1 },
        { user: requestUser },
      );
      expect(result).toEqual(mockUser);
      expect(usersService.findOneByUserIdOrFail).toHaveBeenCalledWith(1);
    });

    it("should load API key when requesting own user details", async () => {
      const mockUser = createMockUser({ id: 1 });
      const requestUser = createMockUser({ id: 1 });
      usersService.findOneByUserIdOrFail.mockResolvedValue(mockUser);
      apiKeyService.findApiKeyOrFail.mockResolvedValue("api-key-123");

      const result = await controller.getUserByUserId(
        { user_id: 1 },
        { user: requestUser },
      );
      expect(result.api_key).toBe("api-key-123");
      expect(apiKeyService.findApiKeyOrFail).toHaveBeenCalledWith(1);
    });

    it("should not load API key when requesting another user's details", async () => {
      const mockUser = createMockUser({ id: 2 });
      const requestUser = createMockUser({ id: 1 });
      usersService.findOneByUserIdOrFail.mockResolvedValue(mockUser);

      await controller.getUserByUserId({ user_id: 2 }, { user: requestUser });
      expect(apiKeyService.findApiKeyOrFail).not.toHaveBeenCalled();
    });
  });

  describe("getUsersMe", () => {
    it("should delegate to getUserByUserId with own ID", async () => {
      const requestUser = createMockUser({ id: 5 });
      usersService.findOneByUserIdOrFail.mockResolvedValue(requestUser);
      apiKeyService.findApiKeyOrFail.mockResolvedValue("api-key-5");

      const result = await controller.getUsersMe({ user: requestUser });
      expect(usersService.findOneByUserIdOrFail).toHaveBeenCalledWith(5);
      expect(result.api_key).toBe("api-key-5");
    });
  });

  describe("putUserByUserId", () => {
    it("should update user and return the updated user", async () => {
      const updatedUser = createMockUser({ username: "newname" });
      const requestUser = createMockUser({ id: 2 });
      usersService.update.mockResolvedValue(updatedUser);

      const result = await controller.putUserByUserId(
        { user_id: 1 },
        { username: "newname" } as any,
        { user: requestUser },
        true,
      );
      expect(result.username).toBe("newname");
      expect(usersService.update).toHaveBeenCalledWith(
        1,
        { username: "newname" },
        true,
      );
    });

    it("should load API key when admin edits own user", async () => {
      const updatedUser = createMockUser({ id: 1 });
      const requestUser = createMockUser({ id: 1, role: Role.ADMIN });
      usersService.update.mockResolvedValue(updatedUser);
      apiKeyService.findApiKeyOrFail.mockResolvedValue("api-key-1");

      const result = await controller.putUserByUserId(
        { user_id: 1 },
        {} as any,
        { user: requestUser },
        true,
      );
      expect(result.api_key).toBe("api-key-1");
    });
  });

  describe("deleteUserByUserId", () => {
    it("should delete user by ID", async () => {
      const deletedUser = createMockUser();
      usersService.delete.mockResolvedValue(deletedUser);

      const result = await controller.deleteUserByUserId({ user_id: 1 });
      expect(result).toEqual(deletedUser);
      expect(usersService.delete).toHaveBeenCalledWith(1);
    });
  });

  describe("postUserRecoverByUserId", () => {
    it("should recover a deleted user", async () => {
      const recoveredUser = createMockUser();
      usersService.recover.mockResolvedValue(recoveredUser);

      const result = await controller.postUserRecoverByUserId({ user_id: 1 });
      expect(result).toEqual(recoveredUser);
      expect(usersService.recover).toHaveBeenCalledWith(1);
    });
  });

  describe("postUsersMeBookmark", () => {
    it("should bookmark a game for the current user", async () => {
      const requestUser = createMockUser({ id: 3, username: "testuser" });
      const userWithBookmarks = createMockUser({ id: 3 });
      usersService.findOneByUsernameOrFail.mockResolvedValue(userWithBookmarks);
      usersService.bookmarkGame.mockResolvedValue(userWithBookmarks);

      await controller.postUsersMeBookmark(
        { user: requestUser },
        { game_id: 42 },
      );
      expect(usersService.bookmarkGame).toHaveBeenCalledWith(3, 42);
    });
  });

  describe("deleteUsersMeBookmark", () => {
    it("should unbookmark a game for the current user", async () => {
      const requestUser = createMockUser({ id: 3, username: "testuser" });
      const userWithBookmarks = createMockUser({ id: 3 });
      usersService.findOneByUsernameOrFail.mockResolvedValue(userWithBookmarks);
      usersService.unbookmarkGame.mockResolvedValue(userWithBookmarks);

      await controller.deleteUsersMeBookmark(
        { user: requestUser },
        { game_id: 42 },
      );
      expect(usersService.unbookmarkGame).toHaveBeenCalledWith(3, 42);
    });
  });
});
