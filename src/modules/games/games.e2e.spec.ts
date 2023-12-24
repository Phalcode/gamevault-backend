/* eslint-disable  @typescript-eslint/no-explicit-any */
import { Test } from "@nestjs/testing";
import { HttpService } from "@nestjs/axios";
import { AppModule } from "../../app.module";
import { Game } from "../games/game.entity";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Builder } from "builder-pattern";
import { GamesController } from "./games.controller";
import gis, { Result } from "async-g-i-s";
import { of } from "rxjs";
jest.mock("async-g-i-s");

describe("/api/games", () => {
  let gamesController: GamesController;
  let gameRepository: Repository<Game>;

  const mockHttpService = {
    get: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(HttpService)
      .useValue(mockHttpService)
      .compile();
    gamesController = moduleRef.get<GamesController>(GamesController);
    gameRepository = moduleRef.get<Repository<Game>>(getRepositoryToken(Game));
  });

  afterEach(() => {
    jest.clearAllMocks();
    gameRepository.clear();
  });

  describe("GET /api/games", () => {
    it("should get all games", async () => {
      //Mock some games
      await gameRepository.save(
        Builder(Game)
          .title("Grand Theft Auto V")
          .file_path("filepath.zip")
          .early_access(false)
          .build(),
      );

      await gameRepository.save(
        Builder(Game)
          .title("Assassin's Creed 2")
          .file_path("filepath2.zip")
          .early_access(false)
          .build(),
      );

      const result = await gamesController.getGames({ path: "/" });

      expect(result.data.length).toBe(2);
    });

    it("should search games by name and description case-insensitive", async () => {
      await gameRepository.save(
        Builder(Game)
          .title("Grand Theft Keyword V")
          .file_path("filepath.zip")
          .early_access(false)
          .build(),
      );

      await gameRepository.save(
        Builder(Game)
          .title("Assassin's Creed 2")
          .description("This Description contains the Keyword")
          .file_path("filepath2.zip")
          .early_access(false)
          .build(),
      );

      await gameRepository.save(
        Builder(Game)
          .title("Grand Theft Motorcycle V")
          .file_path("filepath3.zip")
          .early_access(false)
          .build(),
      );

      await gameRepository.save(
        Builder(Game)
          .title("Assassin's Barn 2")
          .description("This Description does not contain the relevant word")
          .file_path("filepath4.zip")
          .early_access(false)
          .build(),
      );

      const result = await gamesController.getGames({
        path: "/",
        search: "keyword",
      });

      expect(result.data.length).toBe(2);
    });

    it("should filter games by some criteria", async () => {
      await gameRepository.save(
        Builder(Game)
          .title("Grand Theft Auto V")
          .file_path("filepath.zip")
          .release_date(new Date("2015"))
          .early_access(false)
          .build(),
      );

      await gameRepository.save(
        Builder(Game)
          .title("Assassin's Broship")
          .release_date(new Date("2001"))
          .file_path("filepath2.zip")
          .early_access(false)
          .build(),
      );

      const result = await gamesController.getGames({
        path: "/",
        filter: { release_date: "$lt:2011-01-01" },
      });

      expect(result.data.length).toBe(1);
    });
    it("should sort games by some criteria", async () => {
      const game1 = await gameRepository.save(
        Builder(Game)
          .title("Assassin's Broship 3")
          .file_path("filepath.zip")
          .release_date(new Date("2015"))
          .early_access(false)
          .build(),
      );

      const game2 = await gameRepository.save(
        Builder(Game)
          .title("Assassin's Broship 1")
          .release_date(new Date("2001"))
          .file_path("filepath2.zip")
          .early_access(false)
          .build(),
      );

      const game3 = await gameRepository.save(
        Builder(Game)
          .title("Assassin's Broship 2")
          .release_date(new Date("2004"))
          .file_path("filepath3.zip")
          .early_access(false)
          .build(),
      );
      const game4 = await gameRepository.save(
        Builder(Game)
          .title("Assassin's Broship 4")
          .release_date(new Date("2110"))
          .file_path("filepath4.zip")
          .early_access(false)
          .build(),
      );

      const result = await gamesController.getGames({
        path: "/",
        sortBy: [["release_date", "ASC"]],
      });

      expect(result.data.length).toBe(4);
      expect(result.data[0].id).toBe(game2.id);
      expect(result.data[1].id).toBe(game3.id);
      expect(result.data[2].id).toBe(game1.id);
      expect(result.data[3].id).toBe(game4.id);
    });
  });

  describe("GET /api/games/random", () => {
    it("should get a game", async () => {
      const game1 = await gameRepository.save(
        Builder(Game)
          .title("Grand Theft Auto V")
          .file_path("filepath.zip")
          .early_access(false)
          .build(),
      );

      await gameRepository.save(
        Builder(Game)
          .title("Assassin's Creed 2")
          .file_path("filepath2.zip")
          .early_access(false)
          .build(),
      );

      const result = await gamesController.getGameRandom();

      expect(result.id).toBeGreaterThanOrEqual(game1.id);
    });
  });

  describe("GET /api/games/{id}", () => {
    it("should get a game by id", async () => {
      const game1 = await gameRepository.save(
        Builder(Game)
          .title("Grand Theft Auto V")
          .file_path("filepath.zip")
          .early_access(false)
          .build(),
      );

      await gameRepository.save(
        Builder(Game)
          .title("Assassin's Creed 2")
          .file_path("filepath2.zip")
          .early_access(false)
          .build(),
      );

      const result = await gamesController.getGameByGameId({
        id: game1.id.toString(),
      });

      expect(result.id).toBe(game1.id);
    });
  });

  describe("PUT /api/games/{id}", () => {
    it("should update the details of a game by id", async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: {},
        }),
      );
      //Mock Google-Image-Search
      (gis as jest.Mock).mockResolvedValue([
        {
          url: "https://example.com/example.png",
          height: 900,
          width: 600,
        } as Result,
      ]);

      const game = await gameRepository.save(
        Builder(Game)
          .title("Grand Theft Auto V")
          .file_path("filepath.zip")
          .early_access(false)
          .build(),
      );

      const response = await gamesController.putGameUpdate(
        {
          id: game.id.toString(),
        },
        { rawg_id: 1000 },
      );

      const result = await gameRepository.findOneByOrFail({ rawg_id: 1000 });

      expect(response.rawg_id).toBe(1000);
      expect(result.id).toBe(game.id);
      //verify a remap occured (boxart and rawg recache)
      expect(gis).toHaveBeenCalled();
      expect(mockHttpService.get).toHaveBeenCalled();
    });
  });

  describe("GET /api/games/{id}/download", () => {
    it("should download a game by its id", async () => {
      const game1 = await gameRepository.save(
        Builder(Game)
          .title("Assassin's Creed 1")
          .file_path(
            "Assassin's Cr~eed 1 Extreme Emoji Edition 🤡🤡🤡🤡🤡🤡🤡 (EA) (NC) (W_S) (2006).zip",
          )
          .early_access(false)
          .build(),
      );

      const result = await gamesController.getGameDownload({
        id: game1.id.toString(),
      });

      expect(result.getHeaders()).toStrictEqual({
        disposition: `attachment; filename="Assassin's Cr~eed 1 Extreme Emoji Edition  (EA) (NC) (W_S) (2006).zip"`,
        length: 1000,
        type: "application/x-zip",
      });
    });
  });
});
