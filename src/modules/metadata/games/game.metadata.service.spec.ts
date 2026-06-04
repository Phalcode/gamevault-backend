import { NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";

import { GameMetadata } from "./game.metadata.entity";
import { GameMetadataService } from "./game.metadata.service";

jest.mock("../../../configuration", () => ({
  __esModule: true,
  default: {
    TESTING: { MOCK_FILES: true },
  },
}));

jest.mock("../../../logging", () => ({
  __esModule: true,
  default: {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
  logGamevaultGame: jest.fn(),
  logGamevaultUser: jest.fn(),
  logMedia: jest.fn(),
  logMetadata: jest.fn(),
  logMetadataProvider: jest.fn(),
  logProgress: jest.fn(),
}));

describe("GameMetadataService", () => {
  let service: GameMetadataService;
  let repo: jest.Mocked<Partial<Repository<GameMetadata>>>;
  let mockDeveloperService: any;
  let mockPublisherService: any;
  let mockTagService: any;
  let mockGenreService: any;

  beforeEach(() => {
    repo = {
      find: jest.fn(),
      findOneOrFail: jest.fn(),
      findOne: jest.fn(),
      save: jest
        .fn()
        .mockImplementation((e) => Promise.resolve({ ...e, id: e.id ?? 1 })),
      remove: jest.fn().mockImplementation((e) => Promise.resolve(e)),
    };

    mockDeveloperService = {
      save: jest
        .fn()
        .mockImplementation((d) => Promise.resolve({ ...d, id: d.id ?? 100 })),
    };
    mockPublisherService = {
      save: jest
        .fn()
        .mockImplementation((p) => Promise.resolve({ ...p, id: p.id ?? 200 })),
    };
    mockTagService = {
      save: jest
        .fn()
        .mockImplementation((t) => Promise.resolve({ ...t, id: t.id ?? 300 })),
    };
    mockGenreService = {
      save: jest
        .fn()
        .mockImplementation((g) => Promise.resolve({ ...g, id: g.id ?? 400 })),
    };

    service = new GameMetadataService(
      repo as any,
      mockDeveloperService,
      mockPublisherService,
      mockTagService,
      mockGenreService,
    );
  });

  afterEach(() => jest.restoreAllMocks());

  // ─── findByProviderSlug ────────────────────────────────────────────

  describe("findByProviderSlug", () => {
    it("should find metadata by provider slug with defaults", async () => {
      (repo.find as jest.Mock).mockResolvedValue([]);
      await service.findByProviderSlug();
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { provider_slug: "gamevault" },
          relations: undefined,
          withDeleted: false,
        }),
      );
    });

    it("should load all relations when loadRelations is true", async () => {
      (repo.find as jest.Mock).mockResolvedValue([]);
      await service.findByProviderSlug("igdb", {
        loadDeletedEntities: false,
        loadRelations: true,
      });
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: {
            developers: true,
            publishers: true,
            genres: true,
            tags: true,
          },
        }),
      );
    });

    it("should load specific relations when array is given", async () => {
      (repo.find as jest.Mock).mockResolvedValue([]);
      await service.findByProviderSlug("igdb", {
        loadDeletedEntities: false,
        loadRelations: ["developers"],
      });
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ relations: { developers: true } }),
      );
    });
  });

  // ─── findOneByGameMetadataIdOrFail ─────────────────────────────────

  describe("findOneByGameMetadataIdOrFail", () => {
    it("should return metadata when found", async () => {
      const meta = { id: 1, title: "Test" } as GameMetadata;
      (repo.findOneOrFail as jest.Mock).mockResolvedValue(meta);

      const result = await service.findOneByGameMetadataIdOrFail(1);
      expect(result).toBe(meta);
    });

    it("should throw NotFoundException when not found", async () => {
      (repo.findOneOrFail as jest.Mock).mockRejectedValue(
        new Error("Not found"),
      );

      await expect(service.findOneByGameMetadataIdOrFail(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should load relations when loadRelations is true", async () => {
      (repo.findOneOrFail as jest.Mock).mockResolvedValue({} as GameMetadata);
      await service.findOneByGameMetadataIdOrFail(1, {
        loadDeletedEntities: true,
        loadRelations: true,
      });
      expect(repo.findOneOrFail).toHaveBeenCalledWith(
        expect.objectContaining({
          withDeleted: true,
          relations: {
            developers: true,
            publishers: true,
            genres: true,
            tags: true,
          },
        }),
      );
    });
  });

  // ─── deleteByGameMetadataIdOrFail ──────────────────────────────────

  describe("deleteByGameMetadataIdOrFail", () => {
    it("should find and remove the metadata", async () => {
      const meta = { id: 1 } as GameMetadata;
      (repo.findOneOrFail as jest.Mock).mockResolvedValue(meta);

      await service.deleteByGameMetadataIdOrFail(1);
      expect(repo.remove).toHaveBeenCalledWith(meta);
    });

    it("should propagate NotFoundException if metadata not found", async () => {
      (repo.findOneOrFail as jest.Mock).mockRejectedValue(
        new Error("Not found"),
      );
      await expect(service.deleteByGameMetadataIdOrFail(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── save (upsert) ────────────────────────────────────────────────

  describe("save", () => {
    it("should create new metadata when none exists", async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      const metadata = {
        provider_slug: "igdb",
        provider_data_id: "123",
        title: "Test",
      } as GameMetadata;

      await service.save(metadata);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: undefined,
          provider_slug: "igdb",
          provider_data_id: "123",
          title: "Test",
        }),
      );
    });

    it("should update existing metadata by using existing id", async () => {
      (repo.findOne as jest.Mock).mockResolvedValue({ id: 42 });

      const metadata = {
        provider_slug: "igdb",
        provider_data_id: "123",
        title: "Updated",
      } as GameMetadata;

      await service.save(metadata);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 42,
          title: "Updated",
        }),
      );
    });

    it("should upsert developers", async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      const metadata = {
        provider_slug: "igdb",
        provider_data_id: "123",
        title: "Test",
        developers: [
          {
            provider_slug: "igdb",
            provider_data_id: "dev-1",
            name: "Dev Studio",
          },
        ],
      } as GameMetadata;

      const result = await service.save(metadata);
      expect(mockDeveloperService.save).toHaveBeenCalledTimes(1);
      expect(result.developers).toHaveLength(1);
    });

    it("should upsert publishers", async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      const metadata = {
        provider_slug: "igdb",
        provider_data_id: "123",
        title: "Test",
        publishers: [
          {
            provider_slug: "igdb",
            provider_data_id: "pub-1",
            name: "Publisher",
          },
        ],
      } as GameMetadata;

      const result = await service.save(metadata);
      expect(mockPublisherService.save).toHaveBeenCalledTimes(1);
      expect(result.publishers).toHaveLength(1);
    });

    it("should upsert tags", async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      const metadata = {
        provider_slug: "igdb",
        provider_data_id: "123",
        title: "Test",
        tags: [
          { provider_slug: "igdb", provider_data_id: "tag-1", name: "Action" },
        ],
      } as GameMetadata;

      const result = await service.save(metadata);
      expect(mockTagService.save).toHaveBeenCalledTimes(1);
      expect(result.tags).toHaveLength(1);
    });

    it("should upsert genres", async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      const metadata = {
        provider_slug: "igdb",
        provider_data_id: "123",
        title: "Test",
        genres: [
          { provider_slug: "igdb", provider_data_id: "gen-1", name: "RPG" },
        ],
      } as GameMetadata;

      const result = await service.save(metadata);
      expect(mockGenreService.save).toHaveBeenCalledTimes(1);
      expect(result.genres).toHaveLength(1);
    });

    it("should deduplicate developers by provider_slug + provider_data_id", async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      const dev = {
        provider_slug: "igdb",
        provider_data_id: "dev-1",
        name: "Dev",
      };
      const metadata = {
        provider_slug: "igdb",
        provider_data_id: "123",
        title: "Test",
        developers: [dev, { ...dev }], // same dev twice
      } as GameMetadata;

      await service.save(metadata);
      // Should only save once due to dedup
      expect(mockDeveloperService.save).toHaveBeenCalledTimes(1);
    });

    it("should handle errors in relation upserts gracefully", async () => {
      (repo.findOne as jest.Mock).mockResolvedValue(null);

      mockDeveloperService.save.mockRejectedValue(new Error("DB error"));

      const metadata = {
        provider_slug: "igdb",
        provider_data_id: "123",
        title: "Test",
        developers: [
          {
            provider_slug: "igdb",
            provider_data_id: "dev-1",
            name: "Dev",
          },
        ],
      } as GameMetadata;

      // Should not throw - errors are logged and swallowed
      const result = await service.save(metadata);
      expect(result.developers).toHaveLength(0);
    });
  });
});
