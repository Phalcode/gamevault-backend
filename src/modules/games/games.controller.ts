import {
  Body,
  Controller,
  Get,
  Header,
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
  Paginate,
  paginate,
  Paginated,
  PaginateQuery,
  PaginationType,
} from "nestjs-paginate";
import { Repository } from "typeorm";

import configuration from "../../configuration";
import { MinimumRole } from "../../decorators/minimum-role.decorator";
import { PaginateQueryOptions } from "../../decorators/pagination.decorator";
import { ApiOkResponsePaginated } from "../../globals";
import { GamevaultUser } from "../users/gamevault-user.entity";
import { Role } from "../users/models/role.enum";
import { UsersService } from "../users/users.service";
import { FilesService } from "./files.service";
import { GamesService } from "./games.service";
import { GamevaultGame } from "./gamevault-game.entity";
import { GameIdDto } from "./models/game-id.dto";
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
    private usersService: UsersService,
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
    @Request() request: { gamevaultuser: GamevaultUser },
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<GamevaultGame>> {
    const relations = ["bookmarked_users", "metadata", "metadata.cover"];

    if (query.filter?.["metadata"]?.["genres"]?.["name"]) {
      relations.push("metadata.genres");
    }

    if (query.filter?.["metadata"]?.["tags"]?.["name"]) {
      relations.push("metadata.tags");
    }

    if (configuration.PARENTAL.AGE_RESTRICTION_ENABLED) {
      query.filter["metadata"]["age_rating"] =
        `$lte:${await this.usersService.findUserAgeByUsername(request.gamevaultuser.username)}`;
    }

    return paginate(query, this.gamesRepository, {
      paginationType: PaginationType.TAKE_AND_SKIP,
      defaultLimit: 100,
      maxLimit: -1,
      nullSort: "last",
      relations,
      sortableColumns: [
        "id",
        "title",
        "release_date",
        "created_at",
        "size",
        "early_access",
        "type",
        "bookmarked_users.id",
        "metadata.title",
        "metadata.early_access",
        "metadata.release_date",
        "metadata.average_playtime",
        "metadata.rating",
      ],
      loadEagerRelations: false,
      searchableColumns: [
        "id",
        "title",
        "metadata.title",
        "metadata.description",
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
        "metadata.genres.name": true,
        "metadata.tags.name": true,
        "metadata.age_rating": true,
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
  async getGameRandom(
    @Request() request: { gamevaultuser: GamevaultUser },
  ): Promise<GamevaultGame> {
    return this.gamesService.findRandom({
      loadDeletedEntities: false,
      loadRelations: true,
      filterByAge: await this.usersService.findUserAgeByUsername(
        request.gamevaultuser.username,
      ),
    });
  }

  /** Retrieves details for a game with the specified ID. */
  @Get(":game_id")
  @ApiOperation({
    summary: "get details on a game",
    operationId: "getGameByGameId",
  })
  @ApiOkResponse({ type: () => GamevaultGame })
  @MinimumRole(Role.GUEST)
  async getGameByGameId(
    @Request() request: { gamevaultuser: GamevaultUser },
    @Param() params: GameIdDto,
  ): Promise<GamevaultGame> {
    return this.gamesService.findOneByGameIdOrFail(Number(params.game_id), {
      loadRelations: true,
      loadDeletedEntities: true,
      filterByAge: await this.usersService.findUserAgeByUsername(
        request.gamevaultuser.username,
      ),
    });
  }

  /** Download a game by its ID. */
  @Get(":game_id/download")
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
    @Request() request: { gamevaultuser: GamevaultUser },
    @Param() params: GameIdDto,
    @Headers("X-Download-Speed-Limit") speedlimit?: string,
    @Headers("Range") range?: string,
  ): Promise<StreamableFile> {
    return this.filesService.download(
      Number(params.game_id),
      Number(speedlimit),
      range,
      await this.usersService.findUserAgeByUsername(
        request.gamevaultuser.username,
      ),
    );
  }

  @Put(":game_id")
  @ApiOperation({
    summary: "updates the details of a game",
    operationId: "putGameUpdate",
  })
  @ApiBody({ type: () => UpdateGameDto })
  @MinimumRole(Role.EDITOR)
  async putGameUpdate(
    @Param() params: GameIdDto,
    @Body() dto: UpdateGameDto,
  ): Promise<GamevaultGame> {
    return this.gamesService.update(Number(params.game_id), dto);
  }
}
