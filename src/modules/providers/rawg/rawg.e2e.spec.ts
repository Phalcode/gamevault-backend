/* eslint-disable  @typescript-eslint/no-explicit-any */
import { Test } from "@nestjs/testing";
import { RawgController } from "./rawg.controller";
import { HttpService } from "@nestjs/axios";
import { AppModule } from "../../../app.module";
import configuration from "../../../configuration";
import { of } from "rxjs";
import { Game } from "../../games/game.entity";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Builder } from "builder-pattern";
import gis, { Result } from "async-g-i-s";
jest.mock("async-g-i-s");

describe("/api/rawg", () => {
  let rawgController: RawgController;
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
    rawgController = moduleRef.get<RawgController>(RawgController);
    gameRepository = moduleRef.get<Repository<Game>>(getRepositoryToken(Game));
  });

  afterEach(() => {
    jest.clearAllMocks();
    gameRepository.clear();
  });

  describe("GET /api/rawg/search", () => {
    it("should search the rawg api", async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: {
            results: [
              { name: "Totally diferrent game" },
              { name: "Grand Theft Auto V" },
            ],
          },
        }),
      );
      await rawgController.getRawgSearch("Grand Theft Auto V");
      expect(mockHttpService.get).toHaveBeenCalledWith(
        `${configuration.RAWG_API.URL}/games`,
        {
          params: {
            search: "Grand Theft Auto V",
            key: configuration.RAWG_API.KEY,
            dates: undefined,
            stores: configuration.RAWG_API.INCLUDED_STORES.join(),
          },
        },
      );
    });

    it("should remove unnecessary game information", async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: {
            results: [{ name: "Grand Theft Auto V", address: "Wall Street" }],
          },
        }),
      );
      const result = await rawgController.getRawgSearch("Grand Theft Auto V");
      expect(result[0].title).toBe("Grand Theft Auto V");
      expect((result[0] as any).address).toBeUndefined();
    });

    it("should sort the games rawg returns by probabilty", async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: {
            results: [
              { name: "Totally diferrent game" },
              { name: "Grand Theft Auto A" },
              { name: "Grand Theft Auto B" },
              { name: "Grand Theft Auto C" },
              { name: "Grand Theft Auto V" },
              { name: "Grand Theft Auto D" },
              { name: "Grand Theft Auto E" },
              { name: "Grand Theft Auto F" },
            ],
          },
        }),
      );
      const result = await rawgController.getRawgSearch("Grand Theft Auto V");
      //Expect the first game is the exact match
      expect(result[0].title).toBe("Grand Theft Auto V");
      //Expect the last game is the worst match
      expect(result[result.length - 1].title).toBe("Totally diferrent game");
    });
  });

  describe("PUT /api/rawg/{id}/recache", () => {
    it("should not recache '(NC)' flagged games", async () => {
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

      //Mock a game
      const mockGame = await gameRepository.save(
        Builder(Game)
          .title("Minecraft")
          .cache_date(new Date("2022-07-04"))
          .file_path("filepath (NC).zip")
          .early_access(false)
          .build(),
      );

      const result = await rawgController.putRawgRecacheGameByGameId({
        id: mockGame.id.toString(),
      });

      expect(result.title).toBe("Minecraft");
      expect(result.cache_date).toBeNull();
      expect(mockHttpService.get).toHaveBeenCalledTimes(1);
      expect(gis).toHaveBeenCalled();
    });

    it("should recache a game by its id", async () => {
      //Mock Google-Image-Search
      (gis as jest.Mock).mockResolvedValue([
        {
          url: "https://example.com/example.png",
          height: 900,
          width: 600,
        } as Result,
      ]);

      //Mock a game
      const mockGame = await gameRepository.save(
        Builder(Game)
          .title("Grand Theft Auto V")
          .description("wrong description")
          .cache_date(new Date("2022-07-04"))
          .file_path("filepath.zip")
          .early_access(false)
          .build(),
      );

      mockHttpService.get
        //mock search
        .mockReturnValueOnce(
          of({
            data: {
              results: [
                { name: "Totally diferrent game" },
                { name: "Grand Theft Auto A" },
                { name: "Grand Theft Auto B" },
                { name: "Grand Theft Auto C" },
                { name: "Grand Theft Auto V" },
                { name: "Grand Theft Auto D" },
              ],
            },
          }),
        )
        //mock get details
        .mockReturnValueOnce(
          of({
            data: {
              name: "Grand Theft Auto V",
              description_raw: "correct description",
            },
          }),
        )
        //mock rest like boxarts
        .mockReturnValue(
          of({
            data: {},
          }),
        );

      const result = await rawgController.putRawgRecacheGameByGameId({
        id: mockGame.id.toString(),
      });

      //Expect the first game is the exact match
      expect(result.title).toBe("Grand Theft Auto V");
      expect(result.description).toBe("correct description");
      expect(result.cache_date).not.toEqual(mockGame.cache_date);
      expect(gis).toHaveBeenCalled();
      expect(mockHttpService.get).toHaveBeenCalledTimes(3);
    });
  });

  describe("PUT /api/rawg/recache-all", () => {
    it("should recache all games", async () => {
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

      //Mock a game
      await gameRepository.save(
        Builder(Game)
          .title("Grand Theft Auto V")
          .rawg_id(1000)
          .cache_date(new Date("2021-07-04"))
          .file_path("filepath.zip")
          .early_access(false)
          .build(),
      );

      await gameRepository.save(
        Builder(Game)
          .title("Grand Theft Auto IV")
          .rawg_id(1000)
          .cache_date(new Date("2021-07-04"))
          .file_path("filepath2.zip")
          .early_access(false)
          .build(),
      );
      const result = await rawgController.putRawgRecacheAll();
      expect(result).toBe("Successfully recached 2 games");
      const data = await gameRepository.find();
      // Only check if both are null, the rest is tested in the singular recache test
      expect(data[0].cache_date).not.toEqual(new Date("2021-07-04"));
      expect(data[1].cache_date).not.toEqual(new Date("2021-07-04"));
      expect(mockHttpService.get).toHaveBeenCalledTimes(4);
      expect(gis).toHaveBeenCalledTimes(2);
    });
  });
});
