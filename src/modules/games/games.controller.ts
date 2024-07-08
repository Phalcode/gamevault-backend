import {
  Body,
  Controller,
  Get,
  Header,
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
  PaginateQuery,
  Paginated,
  PaginationType,
  paginate,
} from "nestjs-paginate";
import { Repository } from "typeorm";

import { MinimumRole } from "../../decorators/minimum-role.decorator";
import { PaginateQueryOptions } from "../../decorators/pagination.decorator";
import { ApiOkResponsePaginated } from "../../globals";
import { IdDto } from "../database/models/id.dto";
import { Role } from "../users/models/role.enum";
import { FilesService } from "./files.service";
import { GamesService } from "./games.service";
import { GamevaultGame } from "./gamevault-game.entity";
import { UpdateGameDto } from "./models/update-game.dto";

@ApiBasicAuth()
@ApiTags("game")
@Controller("games")
export class GamesController {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private gamesService: GamesService,
    private filesService: FilesService,
    @InjectRepository(GamevaultGame)
    private readonly gamesRepository: Repository<GamevaultGame>,
  ) {}

  @Put("reindex")
  @ApiOperation({
    summary: "manually triggers an index of all games",
    operationId: "putFilesReindex",
  })
  @ApiOkResponse({ type: () => GamevaultGame, isArray: true })
  @MinimumRole(Role.ADMIN)
  async putFilesReindex() {
    return this.filesService.index();
  }

  /** Get paginated games list based on the given query parameters. */
  @Get()
  @PaginateQueryOptions()
  @ApiOkResponsePaginated(GamevaultGame)
  @ApiOperation({
    summary: "get a list of games",
    operationId: "getGames",
  })
  @MinimumRole(Role.GUEST)
  async findGames(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<GamevaultGame>> {
    //TODO: make this more slim and use detail request to get all
    const relations = ["cover", "background", "bookmarked_users"];
    if (query.filter) {
      if (query.filter["genres.name"]) {
        relations.push("genres");
      }
      if (query.filter["tags.name"]) {
        relations.push("tags");
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
        "created_at",
        "size",
        //"metacritic_rating",
        //"average_playtime",
        "early_access",
        "type",
        "bookmarked_users.id",
      ],
      searchableColumns: [
        "title",
        //"description"
      ],
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
  @ApiOkResponse({ type: () => GamevaultGame })
  @MinimumRole(Role.GUEST)
  async getGameRandom(): Promise<GamevaultGame> {
    return this.gamesService.findRandom();
  }

  /** Retrieves details for a game with the specified ID. */
  @Get(":id")
  @ApiOperation({
    summary: "get details on a game",
    operationId: "getGameByGameId",
  })
  @ApiOkResponse({ type: () => GamevaultGame })
  @MinimumRole(Role.GUEST)
  async getGameByGameId(@Param() params: IdDto): Promise<GamevaultGame> {
    return this.gamesService.findOneByGameIdOrFail(Number(params.id), {
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
      "This header lets you set the maximum download speed limit in kibibytes per second (kiB/s) for your request.  If the header is not present the download speed limit will be unlimited.",
    example: "1024",
  })
  @ApiHeader({
    name: "Range",
    required: false,
    description:
      "This header lets you control the range of bytes to download. If the header is not present or not valid the entire file will be downloaded.",
    examples: {
      "bytes=0-1023": {
        description: "Download the first 1024 bytes",
        value: "bytes=-1023",
      },
      "bytes=1024-2047": {
        description: "Download the bytes 1024 through 2047",
        value: "bytes=1024-2047",
      },
      "bytes=1024-": {
        description: "Download the bytes 1024 through the end of the file",
        value: "bytes=1024-",
      },
    },
  })
  @ApiOperation({
    summary: "download a game",
    operationId: "getGameDownload",
  })
  @MinimumRole(Role.USER)
  @ApiOkResponse({ type: () => StreamableFile })
  @Header("Accept-Ranges", "bytes")
  async getGameDownload(
    @Param() params: IdDto,
    @Headers("X-Download-Speed-Limit") speedlimit?: string,
    @Headers("Range") range?: string,
  ): Promise<StreamableFile> {
    return this.filesService.download(
      Number(params.id),
      Number(speedlimit),
      range,
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
  ): Promise<GamevaultGame> {
    return this.gamesService.update(Number(params.id), dto);
  }
}
