import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";

import type { Mocked } from "vitest";
import configurationModule from "../../configuration.js";
import { GameMetadata } from "./games/game.metadata.entity.js";
import { GameMetadataService } from "./games/game.metadata.service.js";
import { MetadataService } from "./metadata.service.js";
import { type MetadataProvider } from "./providers/abstract.metadata-provider.service.js";
import { ProviderNotFoundException } from "./providers/models/provider-not-found.exception.js";

vi.mock("../../configuration.js", async () => ({
  __esModule: true,
  default: {
    METADATA: { TTL_IN_DAYS: 30 },
    GAMES: { WINDOWS_SETUP_DEFAULT_INSTALL_PARAMETERS: '/D="%INSTALLDIR%" /S' },
    TESTING: { MOCK_FILES: true },
  },
}));

vi.mock("../../logging.js", async () => ({
  __esModule: true,
  default: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
  logGamevaultGame: vi.fn((g) => ({ id: g?.id })),
  logGamevaultUser: vi.fn(),
  logMedia: vi.fn(),
  logMetadata: vi.fn(),
  logMetadataProvider: vi.fn((p) => ({ slug: p?.slug })),
  logProgress: vi.fn(),
}));

// Stub out validateOrReject so registerProvider doesn't hit real async validation
vi.mock("class-validator", async () => ({
  ...(await vi.importActual("class-validator")),
  validateOrReject: vi.fn().mockResolvedValue(undefined),
}));

function createMockProvider(
  overrides: Partial<MetadataProvider> = {},
): MetadataProvider {
  return {
    slug: "test-provider",
    name: "Test Provider",
    priority: 10,
    enabled: true,
    request_interval_ms: 0,
    search: vi.fn(),
    getByProviderDataIdOrFail: vi.fn(),
    getBestMatch: vi.fn(),
    register: vi.fn(),
    ...overrides,
  } as unknown as MetadataProvider;
}

describe("MetadataService", () => {
  let service: MetadataService;
  let mockGamesService: any;
  let mockGameMetadataService: Mocked<
    Pick<GameMetadataService, "save" | "deleteByGameMetadataIdOrFail">
  >;

  beforeEach(() => {
    mockGamesService = {
      findOneByGameIdOrFail: vi.fn(),
      save: vi.fn().mockImplementation((g) => Promise.resolve(g)),
      generateSortTitle: vi.fn().mockReturnValue("sort-title"),
    };
    mockGameMetadataService = {
      save: vi.fn().mockImplementation((m) => Promise.resolve({ ...m, id: 1 })),
      deleteByGameMetadataIdOrFail: vi.fn().mockResolvedValue(undefined),
    };

    service = new MetadataService(
      mockGamesService,
      mockGameMetadataService as any,
      configurationModule as any,
    );
  });

  afterEach(() => vi.restoreAllMocks());

  // ─── registerProvider ──────────────────────────────────────────────

  describe("registerProvider", () => {
    it("should register a valid provider", () => {
      const provider = createMockProvider();
      service.registerProvider(provider);
      expect(service.providers).toHaveLength(1);
      expect(service.providers[0].slug).toBe("test-provider");
    });

    it("should throw ConflictException for duplicate slug", () => {
      service.registerProvider(createMockProvider());
      expect(() =>
        service.registerProvider(
          createMockProvider({ slug: "test-provider", priority: 20 }),
        ),
      ).toThrow(ConflictException);
    });

    it("should throw ConflictException for duplicate priority", () => {
      service.registerProvider(createMockProvider());
      expect(() =>
        service.registerProvider(
          createMockProvider({ slug: "other-provider", priority: 10 }),
        ),
      ).toThrow(ConflictException);
    });

    it("should sort providers by priority descending", () => {
      service.registerProvider(
        createMockProvider({ slug: "low", priority: 1 }),
      );
      service.registerProvider(
        createMockProvider({ slug: "high", priority: 100 }),
      );
      service.registerProvider(
        createMockProvider({ slug: "mid", priority: 50 }),
      );

      expect(service.providers.map((p) => p.slug)).toEqual([
        "high",
        "mid",
        "low",
      ]);
    });
  });

  // ─── getProviderBySlugOrFail ───────────────────────────────────────

  describe("getProviderBySlugOrFail", () => {
    it("should return the provider with matching slug", () => {
      const provider = createMockProvider();
      service.registerProvider(provider);
      expect(service.getProviderBySlugOrFail("test-provider")).toBe(provider);
    });

    it("should throw NotFoundException when slug is empty", () => {
      expect(() => service.getProviderBySlugOrFail("")).toThrow(
        NotFoundException,
      );
    });

    it("should throw ProviderNotFoundException when slug not found", () => {
      expect(() => service.getProviderBySlugOrFail("nonexistent")).toThrow(
        ProviderNotFoundException,
      );
    });
  });

  // ─── addUpdateMetadataJob ──────────────────────────────────────────

  describe("addUpdateMetadataJob", () => {
    it("should skip duplicate jobs for the same game id", async () => {
      // Disable processQueue to isolate the dedup logic
      vi.spyOn(service as any, "processQueue").mockResolvedValue(undefined);

      const game = { id: 42, file_path: "/test.zip" } as any;
      await service.addUpdateMetadataJob(game);
      await service.addUpdateMetadataJob(game); // duplicate

      expect((service as any).metadataJobs.size).toBe(1);
    });
  });

  // ─── search ────────────────────────────────────────────────────────

  describe("search", () => {
    it("should delegate search to the provider", async () => {
      const results = [
        {
          provider_slug: "test",
          provider_data_id: "1",
          title: "Test Game",
        },
      ];
      const provider = createMockProvider({
        search: vi.fn().mockResolvedValue(results),
      });
      service.registerProvider(provider);

      const found = await service.search("query", "test-provider");
      expect(found).toEqual(results);
      expect(provider.search).toHaveBeenCalledWith("query");
    });

    it("should throw InternalServerErrorException when provider search throws synchronously", async () => {
      const provider = createMockProvider({
        search: vi.fn().mockImplementation(() => {
          throw new Error("API down");
        }),
      });
      service.registerProvider(provider);

      await expect(service.search("query", "test-provider")).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it("should throw when provider slug not found", async () => {
      await expect(service.search("query", "unknown")).rejects.toThrow(
        ProviderNotFoundException,
      );
    });
  });

  // ─── merge ─────────────────────────────────────────────────────────

  describe("merge", () => {
    it("should skip merge when no metadata sources exist", async () => {
      const game = {
        id: 1,
        provider_metadata: [],
        user_metadata: null,
        metadata: null,
      };
      mockGamesService.findOneByGameIdOrFail.mockResolvedValue(game);

      const result = await service.merge(1);
      expect(result).toBe(game);
      expect(mockGameMetadataService.save).not.toHaveBeenCalled();
    });

    it("should merge provider metadata when available", async () => {
      const providerMeta = {
        provider_slug: "test-provider",
        provider_data_id: "123",
        title: "Provider Title",
        description: "A great game",
        created_at: new Date("2020-01-01"),
        updated_at: new Date("2025-01-01"),
      } as GameMetadata;

      const game = {
        id: 1,
        file_path: "/test.zip",
        release_date: new Date("2020-06-15"),
        type: "WINDOWS_PORTABLE",
        early_access: false,
        provider_metadata: [providerMeta],
        user_metadata: null,
        metadata: null,
      };

      // Register the provider so applyProviderMetadata can look it up
      service.registerProvider(createMockProvider());

      mockGamesService.findOneByGameIdOrFail.mockResolvedValue(game);
      mockGameMetadataService.save.mockImplementation((m) =>
        Promise.resolve({ ...m, id: 10 } as GameMetadata),
      );
      mockGamesService.save.mockImplementation((g: any) => Promise.resolve(g));

      const result = await service.merge(1);
      expect(mockGameMetadataService.save).toHaveBeenCalled();
      const savedMeta = mockGameMetadataService.save.mock.calls[0][0];
      expect(savedMeta.provider_slug).toBe("gamevault");
      expect(savedMeta.provider_data_id).toBe("1");
      expect(savedMeta.title).toBe("Provider Title");
      expect(result.metadata).toBeDefined();
    });

    it("should ignore corrupt gamevault provider metadata during merge", async () => {
      const corruptProviderMeta = {
        id: 99,
        provider_slug: "gamevault",
        provider_data_id: "1",
        title: "Corrupted Title",
        created_at: new Date("2020-01-01"),
        updated_at: new Date("2025-01-02"),
      } as GameMetadata;

      const validProviderMeta = {
        provider_slug: "test-provider",
        provider_data_id: "123",
        title: "Provider Title",
        created_at: new Date("2020-01-01"),
        updated_at: new Date("2025-01-01"),
      } as GameMetadata;

      const game = {
        id: 1,
        file_path: "/test.zip",
        release_date: new Date("2020-06-15"),
        type: "WINDOWS_PORTABLE",
        early_access: false,
        provider_metadata: [corruptProviderMeta, validProviderMeta],
        user_metadata: null,
        metadata: null,
      };

      service.registerProvider(createMockProvider());
      mockGamesService.findOneByGameIdOrFail.mockResolvedValue(game);
      mockGameMetadataService.save.mockImplementation((m) =>
        Promise.resolve({ ...m, id: 10 } as GameMetadata),
      );
      mockGamesService.save.mockImplementation((g: any) => Promise.resolve(g));

      await service.merge(1);

      const savedMeta = mockGameMetadataService.save.mock.calls[0][0];
      expect(savedMeta.title).toBe("Provider Title");
      expect(game.provider_metadata).toEqual([validProviderMeta]);
      expect(mockGamesService.save).toHaveBeenCalledWith(game);
    });

    it("should apply user metadata with highest priority", async () => {
      const providerMeta = {
        provider_slug: "test-provider",
        provider_data_id: "123",
        title: "Provider Title",
        description: "Provider desc",
        created_at: new Date("2020-01-01"),
        updated_at: new Date("2025-01-01"),
      } as GameMetadata;

      const userMeta = {
        provider_slug: "user",
        provider_data_id: "1",
        title: "User Title",
        created_at: new Date("2020-01-01"),
        updated_at: new Date("2025-01-02"),
      } as GameMetadata;

      const game = {
        id: 1,
        file_path: "/test.zip",
        release_date: new Date("2020-06-15"),
        type: "WINDOWS_PORTABLE",
        early_access: false,
        provider_metadata: [providerMeta],
        user_metadata: userMeta,
        metadata: null,
      };

      service.registerProvider(createMockProvider());
      mockGamesService.findOneByGameIdOrFail.mockResolvedValue(game);
      mockGameMetadataService.save.mockImplementation((m) =>
        Promise.resolve({ ...m, id: 10 } as GameMetadata),
      );
      mockGamesService.save.mockImplementation((g: any) => Promise.resolve(g));

      await service.merge(1);
      const savedMeta = mockGameMetadataService.save.mock.calls[0][0];
      // User title should override provider title
      expect(savedMeta.title).toBe("User Title");
      // Provider description should survive (user didn't override it)
      expect(savedMeta.description).toBe("Provider desc");
    });
  });

  // ─── Private helper tests (via merge behavior) ────────────────────

  describe("stripEmptyFields (via merge)", () => {
    it("should strip null/undefined and empty array values from provider metadata", async () => {
      const providerMeta = {
        provider_slug: "test-provider",
        provider_data_id: "123",
        title: "Title",
        description: null,
        tags: [],
        genres: [],
        publishers: [],
        developers: [],
        created_at: new Date("2020-01-01"),
        updated_at: new Date("2025-01-01"),
      } as unknown as GameMetadata;

      const game = {
        id: 1,
        file_path: "/test.zip",
        release_date: new Date("2020-06-15"),
        type: "WINDOWS_PORTABLE",
        early_access: false,
        provider_metadata: [providerMeta],
        user_metadata: null,
        metadata: null,
      };

      service.registerProvider(createMockProvider());
      mockGamesService.findOneByGameIdOrFail.mockResolvedValue(game);
      mockGameMetadataService.save.mockImplementation((m) =>
        Promise.resolve({ ...m, id: 10 } as GameMetadata),
      );
      mockGamesService.save.mockImplementation((g: any) => Promise.resolve(g));

      await service.merge(1);
      const savedMeta = mockGameMetadataService.save.mock.calls[0][0];
      // description was null – should not be in merged result (release_date from base remains)
      expect(savedMeta.title).toBe("Title");
    });
  });

  describe("normalizeRelations (via merge)", () => {
    it("should set provider_slug to gamevault and provider_data_id to kebab-case name", async () => {
      const providerMeta = {
        provider_slug: "test-provider",
        provider_data_id: "123",
        title: "Title",
        genres: [
          {
            id: 99,
            provider_slug: "test-provider",
            provider_data_id: "action",
            name: "Action RPG",
          },
        ],
        tags: [],
        developers: [],
        publishers: [],
        created_at: new Date("2020-01-01"),
        updated_at: new Date("2025-01-01"),
      } as unknown as GameMetadata;

      const game = {
        id: 1,
        file_path: "/test.zip",
        release_date: new Date("2020-06-15"),
        type: "WINDOWS_PORTABLE",
        early_access: false,
        provider_metadata: [providerMeta],
        user_metadata: null,
        metadata: null,
      };

      service.registerProvider(createMockProvider());
      mockGamesService.findOneByGameIdOrFail.mockResolvedValue(game);
      mockGameMetadataService.save.mockImplementation((m) =>
        Promise.resolve({ ...m, id: 10 } as GameMetadata),
      );
      mockGamesService.save.mockImplementation((g: any) => Promise.resolve(g));

      await service.merge(1);
      const savedMeta = mockGameMetadataService.save.mock.calls[0][0];
      expect(savedMeta.genres![0].provider_slug).toBe("gamevault");
      expect(savedMeta.genres![0].provider_data_id).toBe("action-rpg");
      expect(savedMeta.genres![0].id).toBeUndefined();
    });
  });

  // ─── unmap ─────────────────────────────────────────────────────────

  describe("unmap", () => {
    it("should remove provider metadata from game", async () => {
      const game = {
        id: 1,
        provider_metadata: [
          { provider_slug: "test-provider" },
          { provider_slug: "other" },
        ],
        metadata: { id: 10 },
        user_metadata: null,
      };
      mockGamesService.findOneByGameIdOrFail.mockResolvedValue(game);
      mockGamesService.save.mockImplementation((g: any) => Promise.resolve(g));

      await service.unmap(1, "test-provider");

      expect(game.provider_metadata).toHaveLength(1);
      expect(game.provider_metadata[0].provider_slug).toBe("other");
      expect(
        mockGameMetadataService.deleteByGameMetadataIdOrFail,
      ).toHaveBeenCalledWith(10);
    });

    it("should clear user metadata when unmapping 'user'", async () => {
      const game = {
        id: 1,
        provider_metadata: [],
        metadata: null,
        user_metadata: { id: 20, provider_slug: "user" },
      };
      mockGamesService.findOneByGameIdOrFail.mockResolvedValue(game);
      mockGamesService.save.mockImplementation((g: any) => Promise.resolve(g));

      await service.unmap(1, "user");

      expect(game.user_metadata).toBeNull();
      expect(
        mockGameMetadataService.deleteByGameMetadataIdOrFail,
      ).toHaveBeenCalledWith(20);
    });
  });

  // ─── isMetadataFresh (via merge) ───────────────────────────────────

  describe("isMetadataFresh (via merge)", () => {
    it("should skip merge when metadata is fresh and no user_metadata", async () => {
      const now = new Date();
      const game = {
        id: 1,
        file_path: "/test.zip",
        release_date: now,
        type: "WINDOWS_PORTABLE",
        early_access: false,
        provider_metadata: [
          {
            provider_slug: "test-provider",
            provider_data_id: "123",
            title: "Title",
            created_at: new Date("2020-01-01"),
            updated_at: new Date("2020-06-01"),
          },
        ],
        user_metadata: null,
        metadata: {
          id: 10,
          created_at: new Date("2020-01-01"),
          updated_at: new Date("2025-01-01"), // newer than provider
        },
      };

      service.registerProvider(createMockProvider());
      mockGamesService.findOneByGameIdOrFail.mockResolvedValue(game);

      const result = await service.merge(1);
      // Should skip merge since metadata is fresh
      expect(mockGameMetadataService.save).not.toHaveBeenCalled();
      expect(result).toBe(game);
    });
  });
});
