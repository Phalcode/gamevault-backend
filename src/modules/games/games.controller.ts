import {
  Body,
  Controller,
  Get,
  Headers,
  Logger,
  Param,
  Put,
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
import { PaginateQueryOptions } from "../../decorators/pagination.decorator";
import { IdDto } from "../database/models/id.dto";
import { Game } from "./game.entity";
import { FilesService } from "../files/files.service";
import { GamesService } from "./games.service";
import { MinimumRole } from "../../decorators/minimum-role.decorator";
import { Role } from "../users/models/role.enum";
import { UpdateGameDto } from "./models/update-game.dto";

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

  /** Get paginated games list based on the given query parameters. */
  @Get()
  @PaginateQueryOptions()
  @ApiOkResponsePaginated(Game)
  @ApiOperation({
    summary: "get a list of games",
    operationId: "getGames",
  })
  @MinimumRole(Role.GUEST)
  async getGames(@Paginate() query: PaginateQuery): Promise<Paginated<Game>> {
    const relations = ["box_image", "background_image"];
    if (query.filter) {
      if (query.filter["genres.name"]) {
        relations.push("genres");
      }
      if (query.filter["tags.name"]) {
        relations.push("tags");
      }
      if (query.filter["bookmarked_users.id"]) {
        relations.push("bookmarked_users");
      }
    }

    return paginate(query, this.gamesRepository, {
      paginationType: PaginationType.TAKE_AND_SKIP,
      defaultLimit: 100,
      maxLimit: NO_PAGINATION,
      nullSort: "last",
      relations,
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
        "bookmarked_users.id",
      ],
      searchableColumns: ["title", "description"],
      filterableColumns: {
        id: true,
        title: true,
        release_date: true,
        created_at: true,
        size: true,
        metacritic_rating: true,
        average_playtime: true,
        early_access: true,
        type: true,
        "bookmarked_users.id": true,
        "genres.name": true,
        "tags.name": true,
      },
      withDeleted: false,
    });
  }

  /** Retrieves a random game */
  @Get("random")
  @ApiOperation({
    summary: "get a random game",
    operationId: "getGameRandom",
  })
  @ApiOkResponse({ type: () => Game })
  @MinimumRole(Role.GUEST)
  async getGameRandom(): Promise<Game> {
    return await this.gamesService.getRandom();
  }

  /** Retrieves details for a game with the specified ID. */
  @Get(":id")
  @ApiOperation({
    summary: "get details on a game",
    operationId: "getGameByGameId",
  })
  @ApiOkResponse({ type: () => Game })
  @MinimumRole(Role.GUEST)
  async getGameByGameId(@Param() params: IdDto): Promise<Game> {
    return await this.gamesService.findByGameIdOrFail(Number(params.id), {
      loadRelations: true,
      loadDeletedEntities: true,
    });
  }

  /** Download a game by its ID. */
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
    operationId: "getGameDownload",
  })
  @MinimumRole(Role.USER)
  @ApiOkResponse({ type: () => StreamableFile })
  async getGameDownload(
    @Param() params: IdDto,
    @Headers("X-Download-Speed-Limit") speedlimit?: string,
  ): Promise<StreamableFile> {
    return await this.filesService.download(
      Number(params.id),
      Number(speedlimit),
    );
  }

  @Put(":id")
  @ApiOperation({
    summary: "updates the details of a game",
    operationId: "putGameUpdate",
  })
  @ApiBody({ type: () => UpdateGameDto })
  @MinimumRole(Role.EDITOR)
  async putGameUpdate(
    @Param() params: IdDto,
    @Body() dto: UpdateGameDto,
  ): Promise<Game> {
    return await this.gamesService.update(Number(params.id), dto);
  }
}
