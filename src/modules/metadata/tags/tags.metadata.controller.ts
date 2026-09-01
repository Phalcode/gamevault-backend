import { Controller, Get } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Paginate,
  type PaginateQuery,
  type Paginated,
  PaginationType,
  paginate,
} from "nestjs-paginate";
import { Repository } from "typeorm";

import { MinimumRole } from "../../../decorators/minimum-role.decorator.js";
import { PaginateQueryOptions } from "../../../decorators/pagination.decorator.js";
import { ApiOkResponsePaginated } from "../../../globals.js";
import { GamevaultGame } from "../../games/gamevault-game.entity.js";
import { Role } from "../../users/models/role.enum.js";
import { TagMetadata } from "./tag.metadata.entity.js";

@Controller("tags")
@ApiTags("tags")
@ApiBearerAuth()
@ApiSecurity("apikey")
export class TagsController {
  constructor(
    @InjectRepository(TagMetadata)
    private readonly tagRepository: Repository<TagMetadata>,
  ) {}

  /**
   * Get a paginated list of tags, sorted by the number of games tagged with
   * each tag (by default).
   */
  @Get()
  @ApiOperation({
    summary: "get a list of tags",
    description:
      "by default the list is sorted by the amount of games that are tagged with each tag.",
    operationId: "getTags",
  })
  @MinimumRole(Role.GUEST)
  @ApiOkResponsePaginated(TagMetadata)
  @PaginateQueryOptions()
  async getTags(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<TagMetadata>> {
    const queryBuilder = this.tagRepository
      .createQueryBuilder("tag")
      .innerJoin("tag.games", "games")
      .innerJoin(
        GamevaultGame,
        "game",
        "game.metadata_id = games.id AND game.deleted_at IS NULL",
      )
      .where("tag.provider_slug = :provider_slug", {
        provider_slug: "gamevault",
      })
      .groupBy("tag.id");

    // If no specific sort is provided, sort by the number of games in descending order
    if (query.sortBy?.length === 0) {
      queryBuilder
        .addSelect("COUNT(DISTINCT game.id)", "games_count")
        .orderBy("games_count", "DESC");
    }

    const paginatedResults = await paginate(query, queryBuilder, {
      paginationType: PaginationType.TAKE_AND_SKIP,
      defaultLimit: 100,
      maxLimit: -1,
      nullSort: "last",
      loadEagerRelations: false,
      sortableColumns: ["id", "name", "created_at", "provider_slug"],
      searchableColumns: ["name"],
      filterableColumns: {
        id: true,
        created_at: true,
        name: true,
      },
      withDeleted: false,
    });

    return paginatedResults;
  }
}
