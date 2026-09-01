import { type PaginateQuery, PaginationType, paginate } from "nestjs-paginate";
import { Repository } from "typeorm";

import type { Mock, Mocked } from "vitest";
import { GamevaultGame } from "../../games/gamevault-game.entity.js";
import { DeveloperMetadata } from "./developer.metadata.entity.js";
import { DeveloperController } from "./developers.metadata.controller.js";

vi.mock("nestjs-paginate", async () => {
  const actual = await vi.importActual("nestjs-paginate");

  return {
    ...actual,
    paginate: vi.fn(),
  };
});

describe("DeveloperController", () => {
  let controller: DeveloperController;
  let developerRepository: Mocked<Partial<Repository<DeveloperMetadata>>>;
  let queryBuilder: any;

  beforeEach(() => {
    queryBuilder = {
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      addSelect: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
    };

    developerRepository = {
      createQueryBuilder: vi.fn().mockReturnValue(queryBuilder),
    };

    controller = new DeveloperController(developerRepository as any);
    (paginate as Mock).mockReset();
  });

  it("should only query developers linked to non-deleted games", async () => {
    (paginate as Mock).mockResolvedValue({
      data: [],
      meta: {},
      links: {},
    });

    await controller.getDevelopers({} as PaginateQuery);

    expect(queryBuilder.innerJoin).toHaveBeenNthCalledWith(
      1,
      "developer.games",
      "games",
    );
    expect(queryBuilder.innerJoin).toHaveBeenNthCalledWith(
      2,
      GamevaultGame,
      "game",
      "game.metadata_id = games.id AND game.deleted_at IS NULL",
    );
    expect(queryBuilder.groupBy).toHaveBeenCalledWith("developer.id");
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

    await controller.getDevelopers({ sortBy: [] } as unknown as PaginateQuery);

    expect(queryBuilder.addSelect).toHaveBeenCalledWith(
      "COUNT(DISTINCT game.id)",
      "games_count",
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith("games_count", "DESC");
  });
});
