import {
  Body,
  Controller,
  Get,
  Headers,
  Logger,
  Param,
  Put,
  Request,
  StreamableFile,
} from "@nestjs/common";
import {
  ApiBasicAuth,
  ApiBody,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
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
import { ApiOkResponsePaginated } from "../pagination/paginated-api-response.model";
import { PaginateQueryOptions } from "../pagination/pagination.decorator";
import { IdDto } from "../database/models/id.dto";
import { Game } from "./game.entity";
import { all_filters } from "../pagination/all-filters.filter";
import { FilesService } from "../files/files.service";
import { GamesService } from "./games.service";
import { MinimumRole } from "../pagination/minimum-role.decorator";
import { Role } from "../users/models/role.enum";
import { UpdateGameDto } from "./models/update-game.dto";
import { GamevaultUser } from "../users/gamevault-user.entity";

@ApiBasicAuth()
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
  @ApiOperation({
    summary: "get a list of games",
    operationId: "getGames",
  })
  @MinimumRole(Role.GUEST)
  async getGames(@Paginate() query: PaginateQuery): Promise<Paginated<Game>> {
    return paginate(query, this.gamesRepository, {
      paginationType: PaginationType.TAKE_AND_SKIP,
      defaultLimit: 100,
      maxLimit: NO_PAGINATION,
      nullSort: "last",
      select: ["id", "title", "box_image.id"],
      relations: [
        "developers",
        "genres",
        "publishers",
        "tags",
        "progresses",
        "box_image",
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
        "type",
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
        type: all_filters,
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
  @ApiOkResponse({ type: () => Game })
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
  @ApiOkResponse({ type: () => Game })
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
  @ApiHeader({
    name: "X-Download-Speed-Limit",
    required: false,
    description:
      "This header lets you set the maximum download speed limit in kibibytes per second (kiB/s) for your request. (Default unlimited)",
    example: "1024",
  })
  @ApiOperation({
    summary: "download a game",
    operationId: "downloadGame",
  })
  @MinimumRole(Role.USER)
  @ApiOkResponse({ type: () => StreamableFile })
  async downloadGame(
    @Param() params: IdDto,
    @Headers("X-Download-Speed-Limit") speedlimit?: string,
  ): Promise<StreamableFile> {
    return await this.filesService.downloadGame(
      Number(params.id),
      Number(speedlimit),
    );
  }

  @Put(":id")
  @ApiOperation({
    summary: "updates the details of a game",
    operationId: "updateGame",
  })
  @ApiBody({ type: () => UpdateGameDto })
  @MinimumRole(Role.EDITOR)
  async updateGame(
    @Param() params: IdDto,
    @Body() dto: UpdateGameDto,
    @Request() req: { gamevaultuser: GamevaultUser },
  ): Promise<Game> {
    return await this.gamesService.updateGame(
      Number(params.id),
      dto,
      req.gamevaultuser.username,
    );
  }
}
