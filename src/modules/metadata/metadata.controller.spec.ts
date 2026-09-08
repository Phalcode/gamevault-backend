import type { Mock } from "vitest";
import { MetadataController } from "./metadata.controller.js";

describe("MetadataController", () => {
  let controller: MetadataController;
  let metadataService: {
    providers: { getDto: Mock }[];
    getProviderBySlugOrFail: Mock;
  };

  beforeEach(() => {
    metadataService = {
      providers: [{ getDto: vi.fn().mockReturnValue({ slug: "igdb" }) }],
      getProviderBySlugOrFail: vi.fn(),
    };
    controller = new MetadataController(metadataService as any);
  });

  it("maps providers to their dto", async () => {
    const result = await controller.getProviders();
    expect(result).toEqual([{ slug: "igdb" }]);
    expect(metadataService.providers[0].getDto).toHaveBeenCalled();
  });

  it("searches via the provider resolved by slug", async () => {
    const search = vi.fn().mockResolvedValue([{ id: 1 }]);
    metadataService.getProviderBySlugOrFail.mockReturnValue({ search });
    const result = await controller.getSearchResultsByProvider(
      { provider_slug: "igdb" } as any,
      "zelda",
    );
    expect(metadataService.getProviderBySlugOrFail).toHaveBeenCalledWith(
      "igdb",
    );
    expect(search).toHaveBeenCalledWith("zelda");
    expect(result).toEqual([{ id: 1 }]);
  });
});
