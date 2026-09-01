import { ConflictException, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import type { Mocked } from "vitest";
import { GamesService } from "../games/games.service.js";
import { GamevaultGame } from "../games/gamevault-game.entity.js";
import { GamevaultUser } from "../users/gamevault-user.entity.js";
import { Role } from "../users/models/role.enum.js";
import { UsersService } from "../users/users.service.js";
import { State } from "./models/state.enum.js";
import { Progress } from "./progress.entity.js";
import { ProgressService } from "./progress.service.js";

describe("ProgressService", () => {
  let service: ProgressService;
  let progressRepository: Mocked<Repository<Progress>>;
  let usersService: Mocked<UsersService>;
  let gamesService: Mocked<GamesService>;

  const createMockUser = (): GamevaultUser => {
    const user = new GamevaultUser();
    user.id = 1;
    user.username = "testuser";
    user.role = Role.USER;
    return user;
  };

  const createMockGame = (): GamevaultGame => {
    const game = new GamevaultGame();
    game.id = 1;
    game.title = "Test Game";
    return game;
  };

  const createMockProgress = (overrides: Partial<Progress> = {}): Progress => {
    const progress = new Progress();
    progress.id = 1;
    progress.user = createMockUser();
    progress.game = createMockGame();
    progress.minutes_played = 0;
    progress.state = State.UNPLAYED;
    progress.deleted_at = undefined;
    Object.assign(progress, overrides);
    return progress;
  };

  beforeEach(() => {
    progressRepository = {
      findOneOrFail: vi.fn(),
      save: vi.fn(),
      softRemove: vi.fn(),
      remove: vi.fn(),
    } as any;

    usersService = {
      checkIfUsernameMatchesIdOrIsAdminOrThrow: vi.fn().mockResolvedValue(true),
      findOneByUserIdOrFail: vi.fn(),
    } as any;

    gamesService = {
      findOneByGameIdOrFail: vi.fn(),
    } as any;

    service = new ProgressService(
      progressRepository,
      usersService,
      gamesService,
    );
  });

  describe("findOneByProgressId", () => {
    it("should return progress when found", async () => {
      const mockProgress = createMockProgress();
      progressRepository.findOneOrFail.mockResolvedValue(mockProgress);
      const result = await service.findOneByProgressId(1, {
        loadDeletedEntities: false,
        loadRelations: true,
      });
      expect(result).toEqual(mockProgress);
    });

    it("should throw NotFoundException when not found", async () => {
      progressRepository.findOneOrFail.mockRejectedValue(
        new Error("Not found"),
      );
      await expect(
        service.findOneByProgressId(999, {
          loadDeletedEntities: false,
          loadRelations: true,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("findOneByUserIdAndGameIdOrReturnEmptyProgress", () => {
    it("should return existing progress when found", async () => {
      const mockProgress = createMockProgress({
        minutes_played: 60,
        state: State.PLAYING,
      });
      progressRepository.findOneOrFail.mockResolvedValue(mockProgress);
      const result =
        await service.findOneByUserIdAndGameIdOrReturnEmptyProgress(1, 1, {
          loadDeletedEntities: false,
          loadRelations: true,
        });
      expect(result.minutes_played).toBe(60);
      expect(result.state).toBe(State.PLAYING);
    });

    it("should return new empty progress when not found", async () => {
      progressRepository.findOneOrFail.mockRejectedValue(
        new Error("Not found"),
      );
      const mockUser = createMockUser();
      const mockGame = createMockGame();
      usersService.findOneByUserIdOrFail.mockResolvedValue(mockUser);
      gamesService.findOneByGameIdOrFail.mockResolvedValue(mockGame);

      const result =
        await service.findOneByUserIdAndGameIdOrReturnEmptyProgress(1, 1, {
          loadDeletedEntities: false,
          loadRelations: true,
        });
      expect(result.minutes_played).toBe(0);
      expect(result.state).toBe(State.UNPLAYED);
      expect(result.user).toBe(mockUser);
      expect(result.game).toBe(mockGame);
    });
  });

  describe("set", () => {
    it("should update progress state", async () => {
      progressRepository.findOneOrFail.mockRejectedValue(
        new Error("Not found"),
      );
      usersService.findOneByUserIdOrFail.mockResolvedValue(createMockUser());
      gamesService.findOneByGameIdOrFail.mockResolvedValue(createMockGame());
      progressRepository.save.mockImplementation(async (p) => p as any);

      const result = await service.set(
        1,
        1,
        { state: State.PLAYING } as any,
        "testuser",
      );
      expect(result.state).toBe(State.PLAYING);
    });

    it("should update minutes_played and auto-set state to PLAYING", async () => {
      const mockProgress = createMockProgress();
      progressRepository.findOneOrFail.mockResolvedValue(mockProgress);
      progressRepository.save.mockImplementation(async (p) => p as any);

      const result = await service.set(
        1,
        1,
        { minutes_played: 30 } as any,
        "testuser",
      );
      expect(result.minutes_played).toBe(30);
      expect(result.state).toBe(State.PLAYING);
    });

    it("should throw ConflictException if new minutes_played < current", async () => {
      const mockProgress = createMockProgress({ minutes_played: 50 });
      progressRepository.findOneOrFail.mockResolvedValue(mockProgress);

      await expect(
        service.set(1, 1, { minutes_played: 30 } as any, "testuser"),
      ).rejects.toThrow(ConflictException);
    });

    it("should not change state for COMPLETED when updating minutes", async () => {
      const mockProgress = createMockProgress({
        state: State.COMPLETED,
        minutes_played: 100,
      });
      progressRepository.findOneOrFail.mockResolvedValue(mockProgress);
      progressRepository.save.mockImplementation(async (p) => p as any);

      const result = await service.set(
        1,
        1,
        { minutes_played: 110 } as any,
        "testuser",
      );
      expect(result.state).toBe(State.COMPLETED);
    });

    it("should not change state for INFINITE when updating minutes", async () => {
      const mockProgress = createMockProgress({
        state: State.INFINITE,
        minutes_played: 100,
      });
      progressRepository.findOneOrFail.mockResolvedValue(mockProgress);
      progressRepository.save.mockImplementation(async (p) => p as any);

      const result = await service.set(
        1,
        1,
        { minutes_played: 110 } as any,
        "testuser",
      );
      expect(result.state).toBe(State.INFINITE);
    });

    it("should delete empty progress when set to UNPLAYED with 0 minutes", async () => {
      const mockProgress = createMockProgress({ id: 5 });
      progressRepository.findOneOrFail.mockResolvedValue(mockProgress);
      progressRepository.remove.mockResolvedValue(mockProgress);

      await service.set(1, 1, { state: State.UNPLAYED } as any, "testuser");
      expect(progressRepository.remove).toHaveBeenCalledWith(mockProgress);
    });

    it("should set last_played_at when minutes change", async () => {
      const mockProgress = createMockProgress({ minutes_played: 10 });
      progressRepository.findOneOrFail.mockResolvedValue(mockProgress);
      progressRepository.save.mockImplementation(async (p) => p as any);

      const before = new Date();
      const result = await service.set(
        1,
        1,
        { minutes_played: 20 } as any,
        "testuser",
      );
      expect(result.last_played_at).toBeDefined();
      expect(result.last_played_at!.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
    });

    it("should not update last_played_at when minutes stay the same", async () => {
      const mockProgress = createMockProgress({ minutes_played: 10 });
      progressRepository.findOneOrFail.mockResolvedValue(mockProgress);
      progressRepository.save.mockImplementation(async (p) => p as any);

      const result = await service.set(
        1,
        1,
        { minutes_played: 10 } as any,
        "testuser",
      );
      expect(result.last_played_at).toBeUndefined();
    });
  });

  describe("increment", () => {
    it("should increment minutes_played by 1 by default", async () => {
      const mockProgress = createMockProgress({ minutes_played: 10 });
      progressRepository.findOneOrFail.mockResolvedValue(mockProgress);
      progressRepository.save.mockImplementation(async (p) => p as any);

      const result = await service.increment(1, 1, "testuser");
      expect(result.minutes_played).toBe(11);
      expect(result.state).toBe(State.PLAYING);
    });

    it("should increment minutes_played by specified amount", async () => {
      const mockProgress = createMockProgress({ minutes_played: 10 });
      progressRepository.findOneOrFail.mockResolvedValue(mockProgress);
      progressRepository.save.mockImplementation(async (p) => p as any);

      const result = await service.increment(1, 1, "testuser", 5);
      expect(result.minutes_played).toBe(15);
    });

    it("should auto-set state to PLAYING for UNPLAYED progress", async () => {
      const mockProgress = createMockProgress({
        minutes_played: 0,
        state: State.UNPLAYED,
      });
      progressRepository.findOneOrFail.mockResolvedValue(mockProgress);
      progressRepository.save.mockImplementation(async (p) => p as any);

      const result = await service.increment(1, 1, "testuser");
      expect(result.state).toBe(State.PLAYING);
    });

    it("should not change COMPLETED state when incrementing", async () => {
      const mockProgress = createMockProgress({
        minutes_played: 100,
        state: State.COMPLETED,
      });
      progressRepository.findOneOrFail.mockResolvedValue(mockProgress);
      progressRepository.save.mockImplementation(async (p) => p as any);

      const result = await service.increment(1, 1, "testuser");
      expect(result.state).toBe(State.COMPLETED);
    });

    it("should not change INFINITE state when incrementing", async () => {
      const mockProgress = createMockProgress({
        minutes_played: 100,
        state: State.INFINITE,
      });
      progressRepository.findOneOrFail.mockResolvedValue(mockProgress);
      progressRepository.save.mockImplementation(async (p) => p as any);

      const result = await service.increment(1, 1, "testuser");
      expect(result.state).toBe(State.INFINITE);
    });

    it("should update last_played_at", async () => {
      const mockProgress = createMockProgress({ minutes_played: 10 });
      progressRepository.findOneOrFail.mockResolvedValue(mockProgress);
      progressRepository.save.mockImplementation(async (p) => p as any);

      const before = new Date();
      const result = await service.increment(1, 1, "testuser");
      expect(result.last_played_at!.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
    });

    it("should check user authorization", async () => {
      const mockProgress = createMockProgress({ minutes_played: 10 });
      progressRepository.findOneOrFail.mockResolvedValue(mockProgress);
      progressRepository.save.mockImplementation(async (p) => p as any);

      await service.increment(1, 1, "testuser");
      expect(
        usersService.checkIfUsernameMatchesIdOrIsAdminOrThrow,
      ).toHaveBeenCalledWith(1, "testuser");
    });
  });

  describe("deleteByUserIdAndGameId", () => {
    it("should soft-delete progress", async () => {
      const mockProgress = createMockProgress();
      progressRepository.findOneOrFail.mockResolvedValue(mockProgress);
      progressRepository.softRemove.mockResolvedValue({
        ...mockProgress,
        deleted_at: new Date(),
      } as any);

      await service.deleteByUserIdAndGameId(1, 1, "testuser");
      expect(progressRepository.softRemove).toHaveBeenCalled();
    });

    it("should check user authorization", async () => {
      const mockProgress = createMockProgress();
      progressRepository.findOneOrFail.mockResolvedValue(mockProgress);
      progressRepository.softRemove.mockResolvedValue(mockProgress);

      await service.deleteByUserIdAndGameId(1, 1, "testuser");
      expect(
        usersService.checkIfUsernameMatchesIdOrIsAdminOrThrow,
      ).toHaveBeenCalledWith(1, "testuser");
    });
  });

  describe("deleteByProgressId", () => {
    it("should soft-delete progress by ID", async () => {
      const mockProgress = createMockProgress();
      progressRepository.findOneOrFail.mockResolvedValue(mockProgress);
      progressRepository.softRemove.mockResolvedValue({
        ...mockProgress,
        deleted_at: new Date(),
      } as any);

      await service.deleteByProgressId(1, "testuser");
      expect(progressRepository.softRemove).toHaveBeenCalled();
    });
  });
});
