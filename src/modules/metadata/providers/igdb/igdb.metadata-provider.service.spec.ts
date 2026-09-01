import { NotFoundException } from "@nestjs/common";

import { igdb, twitchAccessToken } from "@phalcode/ts-igdb-client";
import type { Mock } from "vitest";
import { IgdbMetadataProviderService } from "./igdb.metadata-provider.service.js";

vi.mock("../../../../configuration.js", () => ({
  __esModule: true,
  default: {
    METADATA: {
      IGDB: {
        ENABLED: true,
        REQUEST_INTERVAL_MS: 0,
        PRIORITY: 10,
        CLIENT_ID: "test-client-id",
        CLIENT_SECRET: "test-client-secret",
      },
    },
    TESTING: { MOCK_FILES: true },
  },
}));

vi.mock("@phalcode/ts-igdb-client", () => ({
  fields: vi.fn((value) => value),
  where: vi.fn((...value) => value),
  whereIn: vi.fn((...value) => value),
  search: vi.fn((value) => value),
  twitchAccessToken: vi.fn(),
  igdb: vi.fn(),
  proto: {},
}));

vi.mock("../../../../logging.js", () => ({
  __esModule: true,
  default: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
  logGamevaultGame: vi.fn(),
  logGamevaultUser: vi.fn(),
  logMedia: vi.fn(),
  logMetadata: vi.fn(),
  logMetadataProvider: vi.fn(),
  logProgress: vi.fn(),
}));

describe("IgdbMetadataProviderService", () => {
  let service: IgdbMetadataProviderService;
  let mockMetadataService: any;
  let mockMediaService: any;

  const gamesData = [
    {
      id: 101,
      url: "https://igdb.com/games/test-game",
      name: "Test Game",
      summary: "Summary",
      storyline: "Storyline",
      first_release_date: 1_700_000_000,
      total_rating: 87.4,
      game_status: { status: "Early Access" },
      websites: [{ url: "https://example.com" }],
      screenshots: [
        { url: "//images.igdb.com/igdb/image/upload/t_thumb/shot" },
      ],
      artworks: [{ url: "//images.igdb.com/igdb/image/upload/t_thumb/art" }],
      videos: [
        { name: "Official Trailer", video_id: "trailer123" },
        { name: "Gameplay Demo", video_id: "gameplay123" },
      ],
      cover: { url: "//images.igdb.com/igdb/image/upload/t_thumb/cover" },
      involved_companies: [
        {
          developer: true,
          publisher: false,
          company: { id: 1, name: "Dev Studio" },
        },
        {
          developer: false,
          publisher: true,
          company: { id: 2, name: "Pub House" },
        },
      ],
      genres: [{ id: 11, name: "RPG" }],
      keywords: [{ id: 21, name: "Fantasy" }],
      themes: [{ id: 31, name: "Dark" }],
      age_ratings: [
        {
          rating_category: { rating: "M" },
        },
      ],
    },
  ];

  beforeEach(() => {
    mockMetadataService = {
      registerProvider: vi.fn(),
    };

    mockMediaService = {
      downloadByUrl: vi
        .fn()
        .mockImplementation((url: string) => Promise.resolve(`saved:${url}`)),
    };

    service = new IgdbMetadataProviderService(
      mockMetadataService,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      mockMediaService,
    );

    (twitchAccessToken as Mock).mockResolvedValue("oauth-token");

    (igdb as Mock).mockImplementation(() => ({
      request: (resource: string) => {
        const execute = vi.fn();
        if (resource === "games") {
          execute.mockResolvedValue({ data: gamesData });
        } else if (resource === "game_time_to_beats") {
          execute.mockResolvedValue({ data: [{ normally: 7_200 }] });
        } else {
          execute.mockResolvedValue({ data: [] });
        }

        return {
          pipe: () => ({ execute }),
        };
      },
    }));
  });

  afterEach(() => vi.restoreAllMocks());

  describe("onModuleInit", () => {
    it("should register provider when credentials are present", async () => {
      await service.onModuleInit();
      expect(mockMetadataService.registerProvider).toHaveBeenCalledWith(
        service,
      );
    });
  });

  describe("search", () => {
    it("should search by id and name and map minimal metadata", async () => {
      const result = await service.search("101");

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toEqual(
        expect.objectContaining({
          provider_slug: "igdb",
          provider_data_id: "101",
          title: "Test Game",
        }),
      );
      expect(result[0].cover_url).toContain("https://");
      expect(result[0].cover_url).toContain("t_cover_big_2x");
    });

    it("should search by name only when query is not a number", async () => {
      const result = await service.search("test game");
      expect(result[0].provider_data_id).toBe("101");
    });
  });

  describe("getByProviderDataIdOrFail", () => {
    it("should map full metadata including media and age rating", async () => {
      const metadata = await service.getByProviderDataIdOrFail("101");

      expect(metadata.provider_slug).toBe("igdb");
      expect(metadata.provider_data_id).toBe("101");
      expect(metadata.age_rating).toBe(17);
      expect(metadata.average_playtime).toBe(120);
      expect(metadata.title).toBe("Test Game");
      expect(metadata.description).toContain("Summary");
      expect(metadata.description).toContain("Storyline");
      expect(metadata.url_trailers).toEqual([
        "https://www.youtube.com/watch?v=trailer123",
      ]);
      expect(metadata.url_gameplays).toEqual([
        "https://www.youtube.com/watch?v=gameplay123",
      ]);
      expect(metadata.developers![0].name).toBe("Dev Studio");
      expect(metadata.publishers![0].name).toBe("Pub House");
      expect(mockMediaService.downloadByUrl).toHaveBeenCalledTimes(2);
    });

    it("should throw NotFoundException when game does not exist", async () => {
      (igdb as Mock).mockImplementationOnce(() => ({
        request: (resource: string) => ({
          pipe: () => ({
            execute: vi.fn().mockResolvedValue({
              data: resource === "games" ? [] : [],
            }),
          }),
        }),
      }));

      await expect(service.getByProviderDataIdOrFail("999")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("fallback behavior", () => {
    it("should return undefined average_playtime when fetching playtime fails", async () => {
      (igdb as Mock).mockImplementation(() => ({
        request: (resource: string) => {
          if (resource === "games") {
            return {
              pipe: () => ({
                execute: vi.fn().mockResolvedValue({ data: gamesData }),
              }),
            };
          }
          return {
            pipe: () => ({
              execute: vi.fn().mockRejectedValue(new Error("boom")),
            }),
          };
        },
      }));

      const metadata = await service.getByProviderDataIdOrFail("101");
      expect(metadata.average_playtime).toBeUndefined();
    });

    it("should return undefined image when media download fails", async () => {
      mockMediaService.downloadByUrl.mockRejectedValueOnce(
        new Error("download failed"),
      );

      const metadata = await service.getByProviderDataIdOrFail("101");
      expect(metadata.cover).toBeUndefined();
    });

    it("should return undefined age rating if ratings cannot be mapped", async () => {
      const gameWithoutMappedRatings = {
        ...gamesData[0],
        age_ratings: [{ rating_category: { rating: "UNKNOWN_RATING" } }],
      };

      (igdb as Mock).mockImplementationOnce(() => ({
        request: (resource: string) => {
          if (resource === "games") {
            return {
              pipe: () => ({
                execute: vi
                  .fn()
                  .mockResolvedValue({ data: [gameWithoutMappedRatings] }),
              }),
            };
          }
          return {
            pipe: () => ({
              execute: vi
                .fn()
                .mockResolvedValue({ data: [{ normally: 3_600 }] }),
            }),
          };
        },
      }));

      const metadata = await service.getByProviderDataIdOrFail("101");
      expect(metadata.age_rating).toBeUndefined();
    });
  });
});
