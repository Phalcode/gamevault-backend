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
import { GenreMetadata } from "./genre.metadata.entity";

@Controller("genres")
@ApiTags("genres")
@ApiBearerAuth()
@ApiSecurity("apikey")
export class GenreController {
  constructor(
    @InjectRepository(GenreMetadata)
    private readonly genreRepository: Repository<GenreMetadata>,
  ) {}

  /**
   * Get a paginated list of genres, sorted by the number of games released by
   * each genre (by default).
   */
  @Get()
  @ApiOperation({
    summary: "get a list of genres",
    description:
      "by default the list is sorted by the amount of games that are in each genre.",
    operationId: "getGenres",
  })
  @MinimumRole(Role.GUEST)
  @ApiOkResponsePaginated(GenreMetadata)
  @PaginateQueryOptions()
  async getGenres(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<GenreMetadata>> {
    const queryBuilder = this.genreRepository
      .createQueryBuilder("genre")
      .leftJoinAndSelect("genre.games", "games", "games.deleted_at IS NULL")
      .where("genre.provider_slug = :provider_slug", {
        provider_slug: "gamevault",
      })
      .groupBy("genre.id")
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
