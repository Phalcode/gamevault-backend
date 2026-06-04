import { Repository } from "typeorm";

import { DeveloperMetadata } from "./developer.metadata.entity";
import { DeveloperMetadataService } from "./developer.metadata.service";

describe("DeveloperMetadataService", () => {
  let service: DeveloperMetadataService;
  let repo: jest.Mocked<Partial<Repository<DeveloperMetadata>>>;

  beforeEach(() => {
    repo = {
      find: jest.fn().mockResolvedValue([]),
      findOneBy: jest.fn(),
      save: jest
        .fn()
        .mockImplementation((e) => Promise.resolve({ ...e, id: e.id ?? 1 })),
    };
    service = new DeveloperMetadataService(repo as any);
  });

  afterEach(() => jest.restoreAllMocks());

  describe("findByProviderSlug", () => {
    it("should find by default gamevault slug", async () => {
      await service.findByProviderSlug();
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { provider_slug: "gamevault" },
          relations: undefined,
          withDeleted: false,
        }),
      );
    });

    it("should load all relations when true", async () => {
      await service.findByProviderSlug("igdb", {
        loadDeletedEntities: true,
        loadRelations: true,
      });
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: { games: true },
          withDeleted: true,
        }),
      );
    });

    it("should load specific relations when array given", async () => {
      await service.findByProviderSlug("igdb", {
        loadDeletedEntities: false,
        loadRelations: ["games"],
      });
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ relations: { games: true } }),
      );
    });
  });

  describe("save", () => {
    it("should create new developer when none exists", async () => {
      (repo.findOneBy as jest.Mock).mockResolvedValue(null);
      const dev = {
        provider_slug: "igdb",
        provider_data_id: "123",
        name: "Rockstar",
      } as DeveloperMetadata;

      await service.save(dev);
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          provider_slug: "igdb",
          provider_data_id: "123",
          name: "Rockstar",
        }),
      );
    });

    it("should update existing developer by merging", async () => {
      const existing = {
        id: 42,
        provider_slug: "igdb",
        provider_data_id: "123",
        name: "Old Name",
      };
      (repo.findOneBy as jest.Mock).mockResolvedValue(existing);

      const dev = {
        provider_slug: "igdb",
        provider_data_id: "123",
        name: "New Name",
      } as DeveloperMetadata;

      await service.save(dev);
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 42,
          name: "New Name",
        }),
      );
    });
  });
});
