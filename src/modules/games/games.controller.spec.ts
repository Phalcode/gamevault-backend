import * as nestjsPaginate from "nestjs-paginate";
import * as nestjsPaginateFilter from "nestjs-paginate/lib/filter";
import { Repository } from "typeorm";
import configuration from "../../configuration";
import { OtpService } from "../otp/otp.service";
import { Progress } from "../progresses/progress.entity";
import { GamevaultUser } from "../users/gamevault-user.entity";
import { Role } from "../users/models/role.enum";
import { UsersService } from "../users/users.service";
import { FilesService } from "./files.service";
import { GamesController } from "./games.controller";
import { GamesService } from "./games.service";
import { GamevaultGame } from "./gamevault-game.entity";

jest.mock("nestjs-paginate", () => {
  const actual = jest.requireActual("nestjs-paginate");
  return {
    ...actual,
    paginate: jest.fn(),
  };
});

jest.mock("nestjs-paginate/lib/filter", () => {
  const actual = jest.requireActual("nestjs-paginate/lib/filter");
  return {
    ...actual,
    addFilter: jest.fn(),
  };
});

describe("GamesController", () => {
  let controller: GamesController;
  let gamesService: jest.Mocked<GamesService>;
  let filesService: jest.Mocked<FilesService>;
  let gamesRepository: jest.Mocked<Repository<GamevaultGame>>;
  let progressRepository: jest.Mocked<Repository<Progress>>;
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

  const createMockGame = (
    overrides: Partial<GamevaultGame> = {},
  ): GamevaultGame => {
    const game = new GamevaultGame();
    game.id = 1;
    game.title = "Test Game";
    game.file_path = "/games/test-game.zip";
    Object.assign(game, overrides);
    return game;
  };

  beforeEach(() => {
    gamesService = {
      findOneByGameIdOrFail: jest.fn(),
      findRandom: jest.fn(),
      update: jest.fn(),
    } as any;

    filesService = {
      indexAllFiles: jest.fn(),
      download: jest.fn(),
      deleteGameFile: jest.fn(),
      upload: jest.fn(),
    } as any;

    gamesRepository = {
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
      manager: {
        getRepository: jest.fn(),
      },
    } as any;

    progressRepository = {
      find: jest.fn(),
    } as any;

    usersService = {
      findUserAgeByUsername: jest.fn().mockResolvedValue(undefined),
    } as any;

    otpService = {
      create: jest.fn().mockReturnValue("mock-otp"),
    } as any;

    controller = new GamesController(
      gamesService,
      filesService,
      gamesRepository,
      progressRepository,
      usersService,
      otpService,
    );

    jest.clearAllMocks();
  });

  describe("findGames", () => {
    it("should resolve metadata tag filters to game ids before paginate", async () => {
      const metadataQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        distinct: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ id: 7 }, { id: "9" }]),
      };

      const metadataRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(metadataQueryBuilder),
      };

      (gamesRepository.manager.getRepository as jest.Mock).mockReturnValue(
        metadataRepository,
      );

      (nestjsPaginateFilter.addFilter as jest.Mock).mockImplementation(() => {
        return {};
      });

      (nestjsPaginate.paginate as jest.Mock).mockResolvedValue({
        data: [],
        meta: {} as any,
        links: {} as any,
      });

      await controller.findGames({ user: createMockUser() }, {
        filter: {
          "metadata.tags.name": "$in:Action",
        },
        sortBy: [],
        path: "api/games",
      } as any);

      expect(gamesRepository.manager.getRepository).toHaveBeenCalled();
      expect(nestjsPaginateFilter.addFilter).toHaveBeenCalledWith(
        metadataQueryBuilder,
        {
          filter: {
            "tags.name": "$in:Action",
          },
        },
        {
          "tags.name": true,
        },
      );
      expect(nestjsPaginate.paginate).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: {
            id: "$in:7,9",
          },
        }),
        gamesRepository,
        expect.objectContaining({
          relations: {
            bookmarked_users: true,
            metadata: {
              background: true,
              cover: true,
              tags: true,
            },
          },
        }),
      );
    });

    it("should resolve metadata tag filter expressions to game ids before paginate", async () => {
      const metadataQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        distinct: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ id: 7 }, { id: "9" }]),
      };

      const metadataRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(metadataQueryBuilder),
      };

      (gamesRepository.manager.getRepository as jest.Mock).mockReturnValue(
        metadataRepository,
      );

      (nestjsPaginateFilter.addFilter as jest.Mock).mockImplementation(() => {
        return {};
      });

      (nestjsPaginate.paginate as jest.Mock).mockResolvedValue({
        data: [],
        meta: {} as any,
        links: {} as any,
      });

      await controller.findGames(
        { user: createMockUser() },
        {
          filterExpression: "metadata.tags.name=$eq:Action OR title=$ilike:Mario",
          sortBy: [],
          path: "api/games",
        } as any,
      );

      expect(gamesRepository.manager.getRepository).toHaveBeenCalled();
      expect(nestjsPaginateFilter.addFilter).toHaveBeenCalledWith(
        metadataQueryBuilder,
        {
          filter: {
            "tags.name": "$eq:Action",
          },
        },
        {
          "tags.name": true,
        },
      );
      expect(nestjsPaginate.paginate).toHaveBeenCalledWith(
        expect.objectContaining({
          filterExpression: "(id=$in:7,9) OR (title=$ilike:Mario)",
        }),
        gamesRepository,
        expect.any(Object),
      );
    });

    it("should append the parental age restriction as a filter expression", async () => {
      const parentalConfig = configuration.PARENTAL as {
        AGE_RESTRICTION_ENABLED: boolean;
      };
      const originalAgeRestrictionEnabled =
        parentalConfig.AGE_RESTRICTION_ENABLED;

      parentalConfig.AGE_RESTRICTION_ENABLED = true;
      usersService.findUserAgeByUsername.mockResolvedValue(16);

      (nestjsPaginate.paginate as jest.Mock).mockResolvedValue({
        data: [],
        meta: {} as any,
        links: {} as any,
      });

      try {
        await controller.findGames(
          { user: createMockUser() },
          {
            filterExpression: "title=$ilike:zelda",
            sortBy: [],
            path: "api/games",
          } as any,
        );

        expect(nestjsPaginate.paginate).toHaveBeenCalledWith(
          expect.objectContaining({
            filterExpression:
              "(title=$ilike:zelda) AND (metadata.age_rating=$null OR metadata.age_rating=$lte:16)",
          }),
          gamesRepository,
          expect.any(Object),
        );
      } finally {
        parentalConfig.AGE_RESTRICTION_ENABLED = originalAgeRestrictionEnabled;
      }
    });
  });

  describe("putFilesReindex", () => {
    it("should trigger file reindexing", async () => {
      filesService.indexAllFiles.mockResolvedValue(undefined);
      await controller.putFilesReindex();
      expect(filesService.indexAllFiles).toHaveBeenCalled();
    });
  });

  describe("postGameUpload", () => {
    it("should upload a game file", async () => {
      const mockFile = {
        buffer: Buffer.from("game-data"),
        originalname: "game.zip",
        size: 1024,
      } as Express.Multer.File;
      filesService.upload.mockResolvedValue({ path: "/games/game.zip" });

      const result = await controller.postGameUpload(mockFile);
      expect(result).toEqual({ path: "/games/game.zip" });
      expect(filesService.upload).toHaveBeenCalledWith(mockFile);
    });
  });

  describe("getGameRandom", () => {
    it("should return a random game", async () => {
      const mockGame = createMockGame();
      gamesService.findRandom.mockResolvedValue(mockGame);
      usersService.findUserAgeByUsername.mockResolvedValue(18);

      const result = await controller.getGameRandom({
        user: createMockUser(),
      });
      expect(result).toEqual(mockGame);
      expect(gamesService.findRandom).toHaveBeenCalledWith(
        expect.objectContaining({
          loadDeletedEntities: false,
          loadRelations: true,
          filterByAge: 18,
        }),
      );
    });
  });

  describe("getGameByGameId", () => {
    it("should return game details by ID", async () => {
      const mockGame = createMockGame({
        id: 5,
        versions: [
          { id: 1, deleted_at: undefined } as any,
          { id: 2, deleted_at: new Date() } as any,
        ],
      });
      gamesService.findOneByGameIdOrFail.mockResolvedValue(mockGame);

      const result = await controller.getGameByGameId(
        { user: createMockUser() },
        { game_id: 5 },
      );
      expect(result).toEqual({
        ...mockGame,
        versions: [{ id: 1, deleted_at: undefined }],
      });
      expect(gamesService.findOneByGameIdOrFail).toHaveBeenCalledWith(5, {
        loadDeletedEntities: true,
        filterByAge: undefined,
      });
    });
  });

  describe("getGameDownload", () => {
    it("should download a game and set OTP header", async () => {
      const mockUser = createMockUser();
      const mockResponse = { setHeader: jest.fn() } as any;
      filesService.download.mockResolvedValue({} as any);

      await controller.getGameDownload(
        { user: mockUser },
        { game_id: 42 },
        mockResponse,
        "1024",
        "bytes=0-999",
      );

      expect(otpService.create).toHaveBeenCalledWith(
        "testuser",
        42,
        undefined,
        1024,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith("X-Otp", "mock-otp");
      expect(filesService.download).toHaveBeenCalledWith(
        mockResponse,
        42,
        undefined,
        1024,
        "bytes=0-999",
        undefined,
      );
    });
  });

  describe("putGameUpdate", () => {
    it("should update game details", async () => {
      const updatedGame = createMockGame({ title: "Updated Game" });
      gamesService.update.mockResolvedValue(updatedGame);

      const result = await controller.putGameUpdate({ game_id: 1 }, {
        title: "Updated Game",
      } as any);
      expect(result.title).toBe("Updated Game");
      expect(gamesService.update).toHaveBeenCalledWith(1, {
        title: "Updated Game",
      });
    });
  });
});
