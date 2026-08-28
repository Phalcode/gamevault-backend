import { Repository } from "typeorm";

import { PublisherMetadata } from "./publisher.metadata.entity";
import { PublisherMetadataService } from "./publisher.metadata.service";

describe("PublisherMetadataService", () => {
  let service: PublisherMetadataService;
  let repo: jest.Mocked<Partial<Repository<PublisherMetadata>>>;

  beforeEach(() => {
    repo = {
      find: jest.fn().mockResolvedValue([]),
      findOneBy: jest.fn(),
      save: jest
        .fn()
        .mockImplementation((e) => Promise.resolve({ ...e, id: e.id ?? 1 })),
    };
    service = new PublisherMetadataService(repo as any);
  });

  describe("findByProviderSlug", () => {
    it("should find by default gamevault slug", async () => {
      await service.findByProviderSlug();
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { provider_slug: "gamevault" },
          relations: undefined,
        }),
      );
    });

    it("should load games relation when loadRelations is true", async () => {
      await service.findByProviderSlug("igdb", {
        loadDeletedEntities: false,
        loadRelations: true,
      });
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({ relations: { games: true } }),
      );
    });
  });

  describe("save", () => {
    it("should create new publisher when none exists", async () => {
      (repo.findOneBy as jest.Mock).mockResolvedValue(null);
      await service.save({
        provider_slug: "igdb",
        provider_data_id: "rockstar",
        name: "Rockstar Games",
      } as PublisherMetadata);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Rockstar Games" }),
      );
    });

    it("should update existing publisher", async () => {
      (repo.findOneBy as jest.Mock).mockResolvedValue({
        id: 20,
        provider_slug: "igdb",
        provider_data_id: "rockstar",
        name: "Old Name",
      });

      await service.save({
        provider_slug: "igdb",
        provider_data_id: "rockstar",
        name: "Rockstar Games",
      } as PublisherMetadata);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 20, name: "Rockstar Games" }),
      );
    });
  });
});
