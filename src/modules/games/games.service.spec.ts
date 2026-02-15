import {
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Repository } from "typeorm";
import { GameMetadataService } from "../metadata/games/game.metadata.service";
import { MetadataService } from "../metadata/metadata.service";
import { GameVersionEntity } from "./game-version.entity";
import { GamesService } from "./games.service";
import { GamevaultGame } from "./gamevault-game.entity";
import { GameExistence } from "./models/game-existence.enum";
import { GameType } from "./models/game-type.enum";

describe("GamesService", () => {
  let service: GamesService;
  let gamesRepository: jest.Mocked<Repository<GamevaultGame>>;
  let gameVersionRepository: jest.Mocked<Repository<GameVersionEntity>>;
  let metadataService: jest.Mocked<MetadataService>;
  let gameMetadataService: jest.Mocked<GameMetadataService>;

  const createMockGame = (
    overrides: Partial<GamevaultGame> = {},
  ): GamevaultGame => {
    const game = new GamevaultGame();
    game.id = 1;
    game.title = "Test Game";
    game.file_path = "/files/Test Game (2023).zip";
    game.size = 1000n;
    game.type = GameType.WINDOWS_SETUP;
    game.early_access = false;
    game.version = "v1.0.0";
    game.download_count = 0;
    game.provider_metadata = [];
    Object.assign(game, overrides);
    return game;
  };

  beforeEach(() => {
    gamesRepository = {
      findOneOrFail: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      softRemove: jest.fn(),
      recover: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as any;

    metadataService = {
      unmap: jest.fn(),
      map: jest.fn(),
      merge: jest.fn(),
      addUpdateMetadataJob: jest.fn(),
    } as any;

    gameMetadataService = {
      save: jest.fn(),
    } as any;

    gameVersionRepository = {
      findOne: jest.fn(),
    } as any;

    service = new GamesService(
      gamesRepository,
      gameVersionRepository,
      metadataService,
      gameMetadataService,
    );
  });

  describe("generateSortTitle", () => {
    it("should remove leading 'the'", () => {
      expect(service.generateSortTitle("The Witcher 3")).toBe("witcher 3");
    });

    it("should remove leading 'a'", () => {
      expect(service.generateSortTitle("A Tale of Paper")).toBe(
        "tale of paper",
      );
    });

    it("should remove leading 'an'", () => {
      expect(service.generateSortTitle("An Epic Adventure")).toBe(
        "epic adventure",
      );
    });

    it("should convert to lowercase", () => {
      expect(service.generateSortTitle("Grand Theft Auto V")).toBe(
        "grand theft auto v",
      );
    });

    it("should remove special characters", () => {
      expect(service.generateSortTitle("Tom Clancy's Splinter Cell")).toBe(
        "tom clancys splinter cell",
      );
    });

    it("should handle empty string", () => {
      expect(service.generateSortTitle("")).toBe("");
    });

    it("should handle string with only special characters", () => {
      expect(service.generateSortTitle("!@#$%")).toBe("");
    });

    it("should collapse multiple spaces", () => {
      expect(service.generateSortTitle("Game   With   Spaces")).toBe(
        "game with spaces",
      );
    });

    it("should trim whitespace", () => {
      expect(service.generateSortTitle("  Trimmed Title  ")).toBe(
        "trimmed title",
      );
    });

    it("should not remove 'the' from middle of title", () => {
      expect(service.generateSortTitle("Into the Breach")).toBe(
        "into the breach",
      );
    });

    it("should handle titles with numbers", () => {
      expect(service.generateSortTitle("7 Days to Die")).toBe("7 days to die");
    });

    it("should not strip 'The' when it is the entire title (no trailing space match)", () => {
      // generateSortTitle only strips articles followed by a space
      expect(service.generateSortTitle("The")).toBe("the");
    });

    it("should not strip 'A' when it is the entire title (no trailing space match)", () => {
      expect(service.generateSortTitle("A")).toBe("a");
    });

    it("should not modify titles without leading articles", () => {
      expect(service.generateSortTitle("Doom Eternal")).toBe("doom eternal");
    });
  });

  describe("findOneByGameIdOrFail", () => {
    it("should return game when found", async () => {
      const mockGame = createMockGame();
      gamesRepository.findOneOrFail.mockResolvedValue(mockGame);
      const result = await service.findOneByGameIdOrFail(1, {
        loadDeletedEntities: false,
      });
      expect(result).toEqual(mockGame);
    });

    it("should throw NotFoundException when game not found", async () => {
      gamesRepository.findOneOrFail.mockRejectedValue(new Error("Not found"));
      await expect(
        service.findOneByGameIdOrFail(999, { loadDeletedEntities: false }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should include deleted entities when option is set", async () => {
      const mockGame = createMockGame();
      gamesRepository.findOneOrFail.mockResolvedValue(mockGame);
      await service.findOneByGameIdOrFail(1, { loadDeletedEntities: true });
      expect(gamesRepository.findOneOrFail).toHaveBeenCalledWith(
        expect.objectContaining({ withDeleted: true }),
      );
    });
  });

  describe("find", () => {
    it("should return all games", async () => {
      const games = [createMockGame(), createMockGame({ id: 2 })];
      gamesRepository.find.mockResolvedValue(games);
      const result = await service.find({
        loadDeletedEntities: false,
        loadRelations: false,
      });
      expect(result).toHaveLength(2);
    });

    it("should load relations when specified", async () => {
      gamesRepository.find.mockResolvedValue([]);
      await service.find({ loadDeletedEntities: false, loadRelations: true });
      expect(gamesRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: expect.arrayContaining(["progresses"]),
        }),
      );
    });
  });

  describe("save", () => {
    it("should save a game and return it", async () => {
      const game = createMockGame();
      gamesRepository.save.mockResolvedValue(game);
      const result = await service.save(game);
      expect(result).toEqual(game);
      expect(gamesRepository.save).toHaveBeenCalledWith(game);
    });
  });

  describe("delete", () => {
    it("should soft delete a game and unmap metadata", async () => {
      const game = createMockGame();
      gamesRepository.softRemove.mockResolvedValue({
        ...game,
        deleted_at: new Date(),
      } as any);
      await service.delete(1);
      expect(metadataService.unmap).toHaveBeenCalledWith(1, null);
      expect(gamesRepository.softRemove).toHaveBeenCalledWith({ id: 1 });
    });
  });

  describe("checkIfExistsInDatabase", () => {
    it("should return DOES_NOT_EXIST when game is new", async () => {
      const game = createMockGame();
      gamesRepository.findOne.mockResolvedValueOnce(null); // by file_path
      gamesRepository.find.mockResolvedValueOnce([]); // by title candidates
      const [existence] = await service.checkIfExistsInDatabase(game);
      expect(existence).toBe(GameExistence.DOES_NOT_EXIST);
    });

    it("should not merge year-tagged games across different years", async () => {
      const game = createMockGame({
        release_date: new Date("2025-01-01T00:00:00.000Z"),
      });

      gamesRepository.findOne.mockResolvedValueOnce(null); // by file_path
      gamesRepository.find.mockResolvedValueOnce([
        createMockGame({ release_date: new Date("2013-01-01T00:00:00.000Z") }),
      ]); // same title, different year

      const [existence] = await service.checkIfExistsInDatabase(game);
      expect(existence).toBe(GameExistence.DOES_NOT_EXIST);
    });

    it("should merge year-tagged game when title and release year match", async () => {
      const game = createMockGame({
        release_date: new Date("2025-01-01T00:00:00.000Z"),
      });

      gamesRepository.findOne.mockResolvedValueOnce(null); // by file_path
      gamesRepository.find.mockResolvedValueOnce([
        createMockGame({
          release_date: new Date("2025-06-15T00:00:00.000Z"),
          deleted_at: null,
        }),
      ]);

      const [existence] = await service.checkIfExistsInDatabase(game);
      expect(existence).toBe(GameExistence.EXISTS);
    });

    it("should merge no-year game into no-year title bucket", async () => {
      const game = createMockGame({ release_date: undefined });

      gamesRepository.findOne.mockResolvedValueOnce(null); // by file_path
      gamesRepository.find.mockResolvedValueOnce([
        createMockGame({ release_date: new Date("2020-01-01T00:00:00.000Z") }),
        createMockGame({ release_date: undefined, deleted_at: null }),
      ]);

      const [existence] = await service.checkIfExistsInDatabase(game);
      expect(existence).toBe(GameExistence.EXISTS);
    });

    it("should return EXISTS when game is identical", async () => {
      const game = createMockGame();
      gamesRepository.findOne.mockResolvedValueOnce(
        createMockGame({ deleted_at: null }),
      );
      const [existence] = await service.checkIfExistsInDatabase(game);
      expect(existence).toBe(GameExistence.EXISTS);
    });

    it("should return EXISTS_BUT_DELETED_IN_DATABASE for soft-deleted game", async () => {
      const game = createMockGame();
      gamesRepository.findOne.mockResolvedValueOnce(
        createMockGame({ deleted_at: new Date() }),
      );
      const [existence, foundGame] =
        await service.checkIfExistsInDatabase(game);
      expect(existence).toBe(GameExistence.EXISTS_BUT_DELETED_IN_DATABASE);
      expect(foundGame).toBeDefined();
    });

    it("should return EXISTS_BUT_ALTERED when game has changes", async () => {
      const game = createMockGame({ title: "New Title" });
      gamesRepository.findOne.mockResolvedValueOnce(
        createMockGame({ title: "Old Title", deleted_at: null }),
      );
      const [existence] = await service.checkIfExistsInDatabase(game);
      expect(existence).toBe(GameExistence.EXISTS_BUT_ALTERED);
    });

    it("should throw InternalServerErrorException for game without required data", async () => {
      const game = createMockGame({
        file_path: undefined,
        title: undefined,
      } as any);
      await expect(service.checkIfExistsInDatabase(game)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe("findRandom", () => {
    it("should return a random game", async () => {
      const mockGame = createMockGame();
      const mockQb = {
        setFindOptions: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getOneOrFail: jest.fn().mockResolvedValue({ id: 1 }),
      };
      gamesRepository.createQueryBuilder.mockReturnValue(mockQb as any);
      gamesRepository.findOneOrFail.mockResolvedValue(mockGame);

      const result = await service.findRandom({
        loadDeletedEntities: false,
        loadRelations: true,
      });
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
    });
  });
});
