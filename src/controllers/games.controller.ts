import { Controller, Get, Logger, Param, StreamableFile } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import {
  NO_PAGINATION,
  Paginate,
  paginate,
  Paginated,
  PaginateQuery,
  PaginationType,
} from "nestjs-paginate";
import { Repository } from "typeorm";
import { ApiOkResponsePaginated } from "../decorators/paginated-api-response.model";
import { PaginateQueryOptions } from "../decorators/pagination.decorator";
import { IdDto } from "../dtos/id.dto";
import { Game } from "../database/entities/game.entity";
import { all_filters } from "../filters/all-filters.filter";
import { FilesService } from "../services/files.service";
import { GamesService } from "../services/games.service";
import { MinimumRole } from "../decorators/minimum-role.decorator";
import { Role } from "../models/role.enum";

@ApiTags("game")
@Controller("games")
export class GamesController {
  private readonly logger = new Logger(GamesController.name);

  constructor(
    private gamesService: GamesService,
    private filesService: FilesService,
    @InjectRepository(Game)
    private readonly gamesRepository: Repository<Game>,
  ) {}

  /**
   * Get paginated games list based on the given query parameters.
   *
   * @param query - The query parameters for pagination.
   * @returns - A promise that resolves to a paginated list of games.
   */
  @Get()
  @PaginateQueryOptions()
  @ApiOkResponsePaginated(Game)
  @ApiOperation({ summary: "get a list of games", operationId: "getGames" })
  @MinimumRole(Role.GUEST)
  async getGames(@Paginate() query: PaginateQuery): Promise<Paginated<Game>> {
    return paginate(query, this.gamesRepository, {
      paginationType: PaginationType.TAKE_AND_SKIP,
      defaultLimit: 100,
      maxLimit: NO_PAGINATION,
      nullSort: "last",
      relations: [
        "developers",
        "genres",
        "publishers",
        "tags",
        "progresses",
        "box_image",
        "background_image",
      ],
      sortableColumns: [
        "id",
        "title",
        "release_date",
        "rawg_release_date",
        "created_at",
        "size",
        "metacritic_rating",
        "average_playtime",
        "early_access",
        "direct_play",
      ],
      searchableColumns: [
        "title",
        "description",
        "developers.name",
        "genres.name",
        "publishers.name",
        "tags.name",
      ],
      filterableColumns: {
        id: all_filters,
        title: all_filters,
        release_date: all_filters,
        created_at: all_filters,
        size: all_filters,
        metacritic_rating: all_filters,
        average_playtime: all_filters,
        early_access: all_filters,
        direct_play: all_filters,
        "developers.name": all_filters,
        "genres.name": all_filters,
        "publishers.name": all_filters,
        "tags.name": all_filters,
        "progresses.created_at": all_filters,
        "progresses.updated_at": all_filters,
        "progresses.minutes_played": all_filters,
        "progresses.state": all_filters,
      },
      withDeleted: false,
    });
  }

  /**
   * Retrieves a random game
   *
   * @param params An object containing the ID of the game to retrieve.
   * @returns A Promise that resolves to the Game object with the specified ID.
   */
  @Get("random")
  @ApiOperation({
    summary: "get a random game",
    operationId: "getRandomGame",
  })
  @ApiOkResponse({ type: Game })
  @MinimumRole(Role.GUEST)
  async getRandomGame(): Promise<Game> {
    return await this.gamesService.getRandomGame();
  }

  /**
   * Retrieves details for a game with the specified ID.
   *
   * @param params An object containing the ID of the game to retrieve.
   * @returns A Promise that resolves to the Game object with the specified ID.
   */
  @Get(":id")
  @ApiOperation({
    summary: "get details on a game",
    operationId: "getGameById",
  })
  @ApiOkResponse({ type: Game })
  @MinimumRole(Role.GUEST)
  async getGameById(@Param() params: IdDto): Promise<Game> {
    return await this.gamesService.getGameById(Number(params.id), true);
  }
  /**
   * Download a game by its ID.
   *
   * @param params The ID of the game to download.
   * @returns A promise that resolves to the downloaded game file.
   * @throws {NotFoundException} If no game with the specified ID is found.
   * @throws {UnauthorizedException} If the user is not authorized to download
   *   the game.
   */
  @Get(":id/download")
  @ApiOperation({ summary: "download a game", operationId: "downloadGame" })
  @MinimumRole(Role.USER)
  @ApiOkResponse({ type: StreamableFile })
  async downloadGame(@Param() params: IdDto): Promise<StreamableFile> {
    return await this.filesService.downloadGame(Number(params.id));
  }
}
