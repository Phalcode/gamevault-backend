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
  PaginateQuery,
  Paginated,
  PaginationType,
  paginate,
} from "nestjs-paginate";
import { Repository } from "typeorm";

import { MinimumRole } from "../../../decorators/minimum-role.decorator";
import { PaginateQueryOptions } from "../../../decorators/pagination.decorator";
import { ApiOkResponsePaginated } from "../../../globals";
import { Role } from "../../users/models/role.enum";
import { DeveloperMetadata } from "./developer.metadata.entity";

@Controller("developers")
@ApiTags("developers")
@ApiBearerAuth()
@ApiSecurity("apikey")
export class DeveloperController {
  constructor(
    @InjectRepository(DeveloperMetadata)
    private readonly developerRepository: Repository<DeveloperMetadata>,
  ) {}

  /**
   * Get a paginated list of developers, sorted by the number of games released by
   * each developer (by default).
   */
  @Get()
  @ApiOperation({
    summary: "get a list of developers",
    description:
      "by default the list is sorted by the amount of games that are developed by the developer.",
    operationId: "getDevelopers",
  })
  @MinimumRole(Role.GUEST)
  @ApiOkResponsePaginated(DeveloperMetadata)
  @PaginateQueryOptions()
  async getDevelopers(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<DeveloperMetadata>> {
    const queryBuilder = this.developerRepository
      .createQueryBuilder("developer")
      .leftJoinAndSelect("developer.games", "games", "games.deleted_at IS NULL")
      .where("developer.provider_slug = :provider_slug", {
        provider_slug: "gamevault",
      })
      .groupBy("developer.id")
      .addGroupBy("games.id")
      .having("COUNT(games.id) > 0");

    // If no specific sort is provided, sort by the number of games in descending order
    if (query.sortBy?.length === 0) {
      queryBuilder
        .addSelect("COUNT(games.id)", "games_count")
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
