import { Controller, Get } from "@nestjs/common";
import { ApiBasicAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Paginate,
  paginate,
  Paginated,
  PaginateQuery,
  PaginationType,
} from "nestjs-paginate";
import { Repository } from "typeorm";

import { MinimumRole } from "../../../decorators/minimum-role.decorator";
import { PaginateQueryOptions } from "../../../decorators/pagination.decorator";
import { ApiOkResponsePaginated } from "../../../globals";
import { Role } from "../../users/models/role.enum";
import { TagMetadata } from "./tag.metadata.entity";

@Controller("tags")
@ApiTags("tags")
@ApiBasicAuth()
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
    const paginatedResults = await paginate(query, this.tagRepository, {
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
