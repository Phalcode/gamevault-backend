import { Controller, Get } from "@nestjs/common";
import {
  ApiBasicAuth,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { MinimumRole } from "../../../decorators/minimum-role.decorator";
import { Role } from "../../users/models/role.enum";
import { GenreMetadata } from "./genre.metadata.entity";
import { ApiOkResponsePaginated } from "../../../globals";
import { PaginateQueryOptions } from "../../../decorators/pagination.decorator";
import { Paginate, PaginateQuery, Paginated, PaginationType, paginate } from "nestjs-paginate";

@Controller("genres")
@ApiTags("genres")
@ApiBasicAuth()
export class GenresController {
  constructor(
    @InjectRepository(GenreMetadata)
    private readonly genreRepository: Repository<GenreMetadata>,
  ) {}

  /**
   * Get a paginated list of genres, sorted by the number of games that are in the genre
   */
  @Get()
  @ApiOperation({
    summary: "get a list of genres",
    description:
      "by default the list is sorted by the amount of games that are in the genre",
    operationId: "getGenres",
  })
  @MinimumRole(Role.GUEST)
  @ApiOkResponsePaginated(GenreMetadata)
  @PaginateQueryOptions()
  async getGenres(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<GenreMetadata>> {
    const paginatedResults = await paginate(query, this.genreRepository, {
      paginationType: PaginationType.TAKE_AND_SKIP,
      defaultLimit: 100,
      maxLimit: -1,
      nullSort: "last",
      relations: ["games"],
      where: {
        provider_slug: "gamevault",
      },
      loadEagerRelations: false,
      sortableColumns: ["id", "name", "created_at"],
      searchableColumns: ["name", "games.title"],
      filterableColumns: {
        id: true,
        created_at: true,
        name: true,
        "games.title": true,
      },
      withDeleted: false,
    });

    if (!query.sortBy || query.sortBy.length === 0) {
      paginatedResults.data.sort((a, b) => b.games.length - a.games.length);
    }

    return paginatedResults;
  }
}
