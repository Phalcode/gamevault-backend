import { Repository } from "typeorm";

import type { Mock, Mocked } from "vitest";
import { TagMetadata } from "./tag.metadata.entity.js";
import { TagMetadataService } from "./tag.metadata.service.js";
describe("TagMetadataService", () => {
  let service: TagMetadataService;
  let repo: Mocked<Partial<Repository<TagMetadata>>>;

  beforeEach(() => {
    repo = {
      find: vi.fn().mockResolvedValue([]),
      findOneBy: vi.fn(),
      save: vi
        .fn()
        .mockImplementation((e) => Promise.resolve({ ...e, id: e.id ?? 1 })),
    };
    service = new TagMetadataService(repo as any);
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
    it("should create new tag when none exists", async () => {
      (repo.findOneBy as Mock).mockResolvedValue(null);
      await service.save({
        provider_slug: "igdb",
        provider_data_id: "action",
        name: "Action",
      } as TagMetadata);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Action" }),
      );
    });

    it("should update existing tag", async () => {
      (repo.findOneBy as Mock).mockResolvedValue({
        id: 30,
        provider_slug: "igdb",
        provider_data_id: "action",
        name: "Old Action",
      });

      await service.save({
        provider_slug: "igdb",
        provider_data_id: "action",
        name: "Action",
      } as TagMetadata);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 30, name: "Action" }),
      );
    });
  });
});
