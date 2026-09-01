import { type PaginateQuery, PaginationType, paginate } from "nestjs-paginate";
import { Repository } from "typeorm";

import type { Mock, Mocked } from "vitest";
import { GamevaultGame } from "../../games/gamevault-game.entity.js";
import { TagMetadata } from "./tag.metadata.entity.js";
import { TagsController } from "./tags.metadata.controller.js";

vi.mock("nestjs-paginate", async () => {
  const actual = await vi.importActual("nestjs-paginate");

  return {
    ...actual,
    paginate: vi.fn(),
  };
});

describe("TagsController", () => {
  let controller: TagsController;
  let tagRepository: Mocked<Partial<Repository<TagMetadata>>>;
  let queryBuilder: any;

  beforeEach(() => {
    queryBuilder = {
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      addSelect: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
    };

    tagRepository = {
      createQueryBuilder: vi.fn().mockReturnValue(queryBuilder),
    };

    controller = new TagsController(tagRepository as any);
    (paginate as Mock).mockReset();
  });

  it("should only query tags linked to non-deleted games", async () => {
    (paginate as Mock).mockResolvedValue({
      data: [],
      meta: {},
      links: {},
    });

    await controller.getTags({} as PaginateQuery);

    expect(queryBuilder.innerJoin).toHaveBeenNthCalledWith(
      1,
      "tag.games",
      "games",
    );
    expect(queryBuilder.innerJoin).toHaveBeenNthCalledWith(
      2,
      GamevaultGame,
      "game",
      "game.metadata_id = games.id AND game.deleted_at IS NULL",
    );
    expect(queryBuilder.groupBy).toHaveBeenCalledWith("tag.id");
    expect(paginate).toHaveBeenCalledWith(
      expect.any(Object),
      queryBuilder,
      expect.objectContaining({
        paginationType: PaginationType.TAKE_AND_SKIP,
      }),
    );
  });

  it("should apply default sorting by game count when sortBy is empty", async () => {
    (paginate as Mock).mockResolvedValue({
      data: [],
      meta: {},
      links: {},
    });

    await controller.getTags({ sortBy: [] } as unknown as PaginateQuery);

    expect(queryBuilder.addSelect).toHaveBeenCalledWith(
      "COUNT(DISTINCT game.id)",
      "games_count",
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith("games_count", "DESC");
  });
});
