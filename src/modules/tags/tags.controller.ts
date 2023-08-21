import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Paginate,
  PaginateQuery,
  Paginated,
  paginate,
  NO_PAGINATION,
  PaginationType,
} from "nestjs-paginate";
import { Repository } from "typeorm";
import { ApiOkResponsePaginated } from "../pagination/paginated-api-response.model";
import { PaginateQueryOptions } from "../pagination/pagination.decorator";
import { Tag } from "./tag.entity";
import { all_filters } from "../pagination/all-filters.filter";
import { MinimumRole } from "../pagination/minimum-role.decorator";
import { Role } from "../users/models/role.enum";

@Controller("tags")
@ApiTags("tags")
export class TagsController {
  constructor(
    @InjectRepository(Tag) private readonly tagRepository: Repository<Tag>,
  ) {}

  /**
   * Get a paginated list of tags, sorted by the number of games tagged with
   * each tag (by default).
   *
   * @returns A paginated list of tags.
   * @throws {HttpException} If the pagination options are invalid or the
   *   database query fails.
   */
  @Get()
  @ApiOperation({
    summary: "get a list of tags",
    description:
      "by default the list is sorted by the amount of games that are tagged with each tag.",
    operationId: "getTags",
  })
  @MinimumRole(Role.GUEST)
  @ApiOkResponsePaginated(Tag)
  @PaginateQueryOptions()
  async getTags(@Paginate() query: PaginateQuery): Promise<Paginated<Tag>> {
    const paginatedResults = await paginate(query, this.tagRepository, {
      paginationType: PaginationType.TAKE_AND_SKIP,
      defaultLimit: Number.MAX_SAFE_INTEGER,
      maxLimit: NO_PAGINATION,
      nullSort: "last",
      relations: ["games"],
      sortableColumns: ["id", "name"],
      searchableColumns: ["name", "games.title"],
      filterableColumns: {
        id: all_filters,
        name: all_filters,
        "games.title": all_filters,
        "games.(genres.name)": all_filters,
      },
      withDeleted: false,
    });

    if (!query.sortBy || query.sortBy.length === 0) {
      paginatedResults.data.sort((a, b) => b.games.length - a.games.length);
    }

    return paginatedResults;
  }
}
