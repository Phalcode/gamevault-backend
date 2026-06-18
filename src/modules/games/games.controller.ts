import {
  Body,
  Controller,
  Get,
  Header,
  Headers,
  Logger,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Put,
  Request,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Response } from "express";
import {
  FilterOperator,
  Paginate,
  PaginateQuery,
  Paginated,
  PaginationType,
  paginate,
} from "nestjs-paginate";
import { In, Not, Repository } from "typeorm";

import { FileInterceptor } from "@nestjs/platform-express";
import bytes from "bytes";
import { isArray } from "lodash";
import { FilterSuffix, addFilter } from "nestjs-paginate/lib/filter";
import configuration from "../../configuration";
import { DisableApiIf } from "../../decorators/disable-api-if.decorator";
import { MinimumRole } from "../../decorators/minimum-role.decorator";
import { PaginateQueryOptions } from "../../decorators/pagination.decorator";
import { ApiOkResponsePaginated, toFindOptionsRelations } from "../../globals";
import { GameMetadata } from "../metadata/games/game.metadata.entity";
import { OtpService } from "../otp/otp.service";
import { State } from "../progresses/models/state.enum";
import { Progress } from "../progresses/progress.entity";
import { GamevaultUser } from "../users/gamevault-user.entity";
import { Role } from "../users/models/role.enum";
import { UsersService } from "../users/users.service";
import { FilesService } from "./files.service";
import { GamesService } from "./games.service";
import { GamevaultGame } from "./gamevault-game.entity";
import { GameIdDto } from "./models/game-id.dto";
import { UpdateGameDto } from "./models/update-game.dto";

const metadataRelationNameFilters = {
  "metadata.genres.name": "genres.name",
  "metadata.tags.name": "tags.name",
  "metadata.developers.name": "developers.name",
  "metadata.publishers.name": "publishers.name",
} as const;

type MetadataRelationNameFilterKey = keyof typeof metadataRelationNameFilters;

@ApiBearerAuth()
@ApiTags("game")
@Controller("games")
@ApiSecurity("apikey")
export class GamesController {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly gamesService: GamesService,
    private readonly filesService: FilesService,
    @InjectRepository(GamevaultGame)
    private readonly gamesRepository: Repository<GamevaultGame>,
    @InjectRepository(Progress)
    private readonly progressRepository: Repository<Progress>,
    private readonly usersService: UsersService,
    private readonly otpService: OtpService,
  ) {}

  @Put("reindex")
  @ApiOperation({
    summary: "manually triggers an index of all games",
    operationId: "putFilesReindex",
  })
  @ApiOkResponse({ type: () => GamevaultGame, isArray: true })
  @MinimumRole(Role.ADMIN)
  async putFilesReindex() {
    return this.filesService.indexAllFiles();
  }

  /** Upload a game file to the server. */
  @Post()
  @ApiOperation({
    summary: "upload a game file to the server",
    description: `Upload a game file directly to the game library. Only administrators can use this endpoint. The file must have a supported game file format. The server must have write permissions on the files volume.`,
    operationId: "postGameUpload",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      properties: {
        file: {
          type: "string",
          format: "binary",
          description: "The game file to upload",
        },
      },
    },
  })
  @ApiOkResponse({
    schema: {
      properties: {
        path: {
          type: "string",
          description: "The path where the game file was saved",
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor("file"))
  @MinimumRole(Role.ADMIN)
  @DisableApiIf(configuration.SERVER.DEMO_MODE_ENABLED)
  async postGameUpload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: configuration.GAMES.MAX_UPLOAD_SIZE,
            message: `File exceeds maximum allowed upload size of ${bytes(configuration.GAMES.MAX_UPLOAD_SIZE, { unit: "GB", thousandsSeparator: "." })}.`,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.filesService.upload(file);
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
    @Request() request: { user: GamevaultUser },
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<GamevaultGame>> {
    const relations = [
      "bookmarked_users",
      "metadata",
      "metadata.cover",
      "metadata.background",
    ];

    if (query.filter?.["metadata.genres.name"]) {
      relations.push("metadata.genres");
    }

    if (query.filter?.["metadata.tags.name"]) {
      relations.push("metadata.tags");
    }

    if (query.filter?.["metadata.developers.name"]) {
      relations.push("metadata.developers");
    }

    if (query.filter?.["metadata.publishers.name"]) {
      relations.push("metadata.publishers");
    }

    query = this.redirectLegacyQueries(query);

    const progressStateFilter = query.filter?.["progresses.state"];
    const progressUserFilter = query.filter?.["progresses.user.id"];

    // "UNPLAYED" means either:
    //   a) The user has no progress record for this game at all, OR
    //   b) The user has a progress record with state explicitly set to UNPLAYED.
    //
    // We can't use nestjs-paginate's column-level filters for this because:
    //   1. A LEFT JOIN on progresses returns rows for ALL users' progress,
    //      so a $null check only matches when NO user has a progress record
    //      — not just the requesting user.
    //   2. nestjs-paginate forces INNER JOIN on filtered relations, which
    //      drops games with no progress rows before IS NULL can match.
    //
    // Instead, we pre-query the game IDs where this user has a non-UNPLAYED
    // progress and exclude them via PaginateConfig.where.
    let unplayedWhereCondition = undefined;

    if (progressStateFilter || progressUserFilter) {
      if (progressStateFilter?.includes("UNPLAYED")) {
        let userId = request.user.id;
        if (progressUserFilter && !isArray(progressUserFilter)) {
          userId = Number(progressUserFilter.split(":").pop());
        }

        const playedProgresses = await this.progressRepository.find({
          where: {
            user: { id: userId },
            state: Not(State.UNPLAYED),
          },
          relations: toFindOptionsRelations<Progress>(["game"]),
          select: { game: { id: true } },
        });

        const excludedGameIds = playedProgresses
          .filter((p) => p.game != null)
          .map((p) => p.game.id);

        if (excludedGameIds.length > 0) {
          unplayedWhereCondition = { id: Not(In(excludedGameIds)) };
        }

        // Remove progress filters — handled by the pre-query above
        delete query.filter["progresses.state"];
        delete query.filter["progresses.user.id"];
      } else {
        relations.push("progresses", "progresses.user");
      }
    }

    const relationFilteredGameIds =
      await this.resolveMetadataRelationNameFilterGameIds(query);

    if (relationFilteredGameIds) {
      this.removeMetadataRelationNameFilters(query);
      this.applyResolvedGameIdFilter(query, relationFilteredGameIds);
    }

    if (
      configuration.PARENTAL.AGE_RESTRICTION_ENABLED &&
      request.user.role !== Role.ADMIN
    ) {
      query.filter ??= {};
      query.filter["metadata.age_rating"] = [
        `$null`,
        `$or:$lte:${await this.usersService.findUserAgeByUsername(request.user.username)}`,
      ];
    }

    return paginate(query, this.gamesRepository, {
      paginationType: PaginationType.TAKE_AND_SKIP,
      where: unplayedWhereCondition,
      defaultLimit: 100,
      defaultSortBy: [["sort_title", "ASC"]],
      maxLimit: -1,
      nullSort: "last",
      relations,
      sortableColumns: [
        "id",
        "title",
        "sort_title",
        "created_at",
        "size",
        "type",
        "download_count",
        "bookmarked_users.id",
        "metadata.title",
        "metadata.early_access",
        "metadata.release_date",
        "metadata.average_playtime",
        "metadata.age_rating",
        "metadata.rating",
      ],
      loadEagerRelations: false,
      searchableColumns: [
        "id",
        "title",
        "file_path",
        "metadata.title",
        "metadata.description",
      ],
      filterableColumns: {
        id: true,
        title: true,
        file_path: true,
        created_at: true,
        updated_at: true,
        size: true,
        metacritic_rating: true,
        average_playtime: true,
        type: true,
        download_count: true,
        "bookmarked_users.id": true,
        "metadata.genres.name": true,
        "metadata.tags.name": true,
        "metadata.developers.name": true,
        "metadata.publishers.name": true,
        "metadata.release_date": true,
        "metadata.early_access": true,
        "metadata.age_rating": true,
        "progresses.state": [
          FilterOperator.EQ,
          FilterOperator.NULL,
          FilterSuffix.NOT,
        ],
        "progresses.user.id": [
          FilterOperator.EQ,
          FilterOperator.NULL,
          FilterSuffix.NOT,
        ],
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
    @Request() request: { user: GamevaultUser },
  ): Promise<GamevaultGame> {
    return this.gamesService.findRandom({
      loadDeletedEntities: false,
      loadRelations: true,
      filterByAge: await this.usersService.findUserAgeByUsername(
        request.user.username,
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
    @Request() request: { user: GamevaultUser },
    @Param() params: GameIdDto,
  ): Promise<GamevaultGame> {
    const game = await this.gamesService.findOneByGameIdOrFail(
      Number(params.game_id),
      {
        loadDeletedEntities: true,
        filterByAge: await this.usersService.findUserAgeByUsername(
          request.user.username,
        ),
      },
    );

    game.versions = (game.versions || []).filter(
      (version) => !version.deleted_at,
    );
    return game;
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
    summary: "download latest game version",
    description:
      "Deprecated legacy endpoint. Downloads the default/latest version for compatibility. Use GET /game/:gameId/versions/:versionId for explicit version downloads.",
    deprecated: true,
    operationId: "getGameDownload",
  })
  @MinimumRole(Role.USER)
  @ApiOkResponse({ type: () => StreamableFile })
  @Header("Accept-Ranges", "bytes")
  async getGameDownload(
    @Request() request: { user: GamevaultUser },
    @Param() params: GameIdDto,
    @Res({ passthrough: true }) response: Response,
    @Headers("X-Download-Speed-Limit") speedlimit?: string,
    @Headers("Range") range?: string,
  ): Promise<StreamableFile> {
    response.setHeader(
      "X-Otp",
      this.otpService.create(
        request.user.username,
        Number(params.game_id),
        undefined,
        Number(speedlimit),
      ),
    );
    return this.filesService.download(
      response,
      Number(params.game_id),
      undefined,
      Number(speedlimit),
      range,
      await this.usersService.findUserAgeByUsername(request.user.username),
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

  private redirectLegacyQueries(query: PaginateQuery) {
    // Early Access
    if (query.filter?.["early_access"]) {
      this.logger.debug({
        message:
          'Redirecting legacy filter key "early_access" to "metadata.early_access"',
        oldValue: query.filter["early_access"],
      });

      query.filter["metadata.early_access"] = query.filter["early_access"];
      delete query.filter["early_access"];
    }

    const sortByEarlyAccess = query.sortBy?.find(
      (x) => x[0] === "early_access",
    );
    if (sortByEarlyAccess) {
      this.logger.debug({
        message:
          'Redirecting legacy sort key "early_access" to "metadata.early_access"',
        direction: sortByEarlyAccess[1],
      });

      query.sortBy.push(["metadata.early_access", sortByEarlyAccess[1]]);
      delete query.sortBy[query.sortBy.indexOf(sortByEarlyAccess)];
    }

    // Release Date
    if (query.filter?.["release_date"]) {
      this.logger.debug({
        message:
          'Redirecting legacy filter key "release_date" to "metadata.release_date"',
        oldValue: query.filter["release_date"],
      });

      query.filter["metadata.release_date"] = query.filter["release_date"];
      delete query.filter["release_date"];
    }

    const sortByReleaseDate = query.sortBy?.find(
      (x) => x[0] === "release_date",
    );
    if (sortByReleaseDate) {
      this.logger.debug({
        message:
          'Redirecting legacy sort key "release_date" to "metadata.release_date"',
        direction: sortByReleaseDate[1],
      });

      query.sortBy.push(["metadata.release_date", sortByReleaseDate[1]]);
      delete query.sortBy[query.sortBy.indexOf(sortByReleaseDate)];
    }

    return query;
  }

  private async resolveMetadataRelationNameFilterGameIds(
    query: PaginateQuery,
  ): Promise<number[] | undefined> {
    const activeFilters = Object.entries(metadataRelationNameFilters).filter(
      ([filterKey]) => query.filter?.[filterKey] != null,
    ) as Array<
      [
        MetadataRelationNameFilterKey,
        (typeof metadataRelationNameFilters)[MetadataRelationNameFilterKey],
      ]
    >;

    if (activeFilters.length === 0) {
      return undefined;
    }

    let matchingIds: number[] | undefined;

    for (const [queryFilterKey, metadataFilterKey] of activeFilters) {
      const filterValue = query.filter?.[queryFilterKey];

      if (filterValue == null) {
        continue;
      }

      const metadataQuery = {
        filter: {
          [metadataFilterKey]: filterValue,
        },
      } as PaginateQuery;

      const queryBuilder = this.gamesRepository.manager
        .getRepository(GameMetadata)
        .createQueryBuilder("metadata")
        .select("game.id", "id")
        .distinct(true)
        .innerJoin(GamevaultGame, "game", "game.metadata_id = metadata.id");

      addFilter(queryBuilder, metadataQuery, {
        [metadataFilterKey]: true,
      });

      const resolvedIds = (
        await queryBuilder.getRawMany<{ id: number | string }>()
      )
        .map(({ id }) => Number(id))
        .filter((id) => Number.isInteger(id));

      if (matchingIds == null) {
        matchingIds = resolvedIds;
      } else {
        const resolvedIdSet = new Set(resolvedIds);
        matchingIds = matchingIds.filter((id) => resolvedIdSet.has(id));
      }

      if (matchingIds.length === 0) {
        break;
      }
    }

    return matchingIds;
  }

  private removeMetadataRelationNameFilters(query: PaginateQuery) {
    for (const filterKey of Object.keys(metadataRelationNameFilters)) {
      delete query.filter?.[filterKey];
    }
  }

  private applyResolvedGameIdFilter(query: PaginateQuery, gameIds: number[]) {
    query.filter ??= {};

    const resolvedIdFilter =
      gameIds.length > 0 ? `$in:${gameIds.join(",")}` : "$eq:-1";
    const existingIdFilter = query.filter.id;

    if (existingIdFilter == null) {
      query.filter.id = resolvedIdFilter;
      return;
    }

    if (isArray(existingIdFilter)) {
      query.filter.id = [...existingIdFilter, resolvedIdFilter];
      return;
    }

    query.filter.id = [existingIdFilter, resolvedIdFilter];
  }
}
