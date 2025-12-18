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
import { PublisherMetadata } from "./publisher.metadata.entity";

@Controller("publishers")
@ApiTags("publishers")
@ApiBearerAuth()
@ApiSecurity("apikey")
export class PublisherController {
  constructor(
    @InjectRepository(PublisherMetadata)
    private readonly publisherRepository: Repository<PublisherMetadata>,
  ) {}

  /**
   * Get a paginated list of publishers, sorted by the number of games released by
   * each publisher (by default).
   */
  @Get()
  @ApiOperation({
    summary: "get a list of publishers",
    description:
      "by default the list is sorted by the amount of games that are published by the publisher.",
    operationId: "getPublishers",
  })
  @MinimumRole(Role.GUEST)
  @ApiOkResponsePaginated(PublisherMetadata)
  @PaginateQueryOptions()
  async getPublishers(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<PublisherMetadata>> {
    const queryBuilder = this.publisherRepository
      .createQueryBuilder("publisher")
      .leftJoinAndSelect("publisher.games", "games", "games.deleted_at IS NULL")
      .where("publisher.provider_slug = :provider_slug", {
        provider_slug: "gamevault",
      })
      .groupBy("publisher.id")
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
