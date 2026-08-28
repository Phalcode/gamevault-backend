import { Repository } from "typeorm";

import { GenreMetadata } from "./genre.metadata.entity";
import { GenreMetadataService } from "./genre.metadata.service";

describe("GenreMetadataService", () => {
  let service: GenreMetadataService;
  let repo: jest.Mocked<Partial<Repository<GenreMetadata>>>;

  beforeEach(() => {
    repo = {
      find: jest.fn().mockResolvedValue([]),
      findOneBy: jest.fn(),
      save: jest
        .fn()
        .mockImplementation((e) => Promise.resolve({ ...e, id: e.id ?? 1 })),
    };
    service = new GenreMetadataService(repo as any);
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
    it("should create new genre when none exists", async () => {
      (repo.findOneBy as jest.Mock).mockResolvedValue(null);
      await service.save({
        provider_slug: "igdb",
        provider_data_id: "rpg",
        name: "RPG",
      } as GenreMetadata);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: "RPG" }),
      );
    });

    it("should update existing genre", async () => {
      (repo.findOneBy as jest.Mock).mockResolvedValue({
        id: 10,
        provider_slug: "igdb",
        provider_data_id: "rpg",
        name: "Role Playing",
      });

      await service.save({
        provider_slug: "igdb",
        provider_data_id: "rpg",
        name: "RPG",
      } as GenreMetadata);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 10, name: "RPG" }),
      );
    });
  });
});
