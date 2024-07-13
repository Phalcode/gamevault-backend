import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Put,
  Request,
} from "@nestjs/common";
import {
  ApiBasicAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
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
import configuration from "../../configuration";
import { DisableApiIf } from "../../decorators/disable-api-if.decorator";
import { MinimumRole } from "../../decorators/minimum-role.decorator";
import { PaginateQueryOptions } from "../../decorators/pagination.decorator";
import { ApiOkResponsePaginated } from "../../globals";
import { GamevaultUser } from "../users/gamevault-user.entity";
import { Role } from "../users/models/role.enum";
import { UsersService } from "../users/users.service";
import { IncrementProgressByMinutesDto } from "./models/increment-progress-by-minutes.dto";
import { ProgressIdDto } from "./models/progress-id.dto";
import { UpdateProgressDto } from "./models/update-progress.dto";
import { UserIdGameIdDto } from "./models/user-id-game-id.dto";
import { Progress } from "./progress.entity";
import { ProgressService } from "./progress.service";

@Controller("progresses")
@ApiTags("progress")
@ApiBasicAuth()
export class ProgressController {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private progressService: ProgressService,
    private usersService: UsersService,
    @InjectRepository(Progress)
    private readonly progressRepository: Repository<Progress>,
  ) {}

  /** Get an array of files to ignore for progress-tracking. */
  @Get("ignorefile")
  @ApiOperation({
    summary: "get an array of files to ignore for progess-tracking",
    operationId: "getIgnoreFile",
  })
  @MinimumRole(Role.GUEST)
  @ApiOkResponse({ type: () => String, isArray: true })
  getIgnoreFile(): string[] {
    return this.progressService.ignoreList;
  }

  /** Get paginated progress list based on the given query parameters. */
  @Get()
  @PaginateQueryOptions()
  @ApiOkResponsePaginated(Progress)
  @ApiOperation({
    summary: "get a list of progresses",
    operationId: "getProgresses",
  })
  @MinimumRole(Role.GUEST)
  async findProgresses(
    @Request() request: { gamevaultuser: GamevaultUser },
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Progress>> {
    const relations = ["user", "game"];

    if (configuration.PARENTAL.AGE_RESTRICTION_ENABLED) {
      query.filter["game"]["metadata"]["age_rating"] =
        `$lte:${await this.usersService.findUserAgeByUsername(request.gamevaultuser.username)}`;
    }

    return paginate(query, this.progressRepository, {
      paginationType: PaginationType.TAKE_AND_SKIP,
      defaultLimit: 100,
      maxLimit: -1,
      nullSort: "last",
      relations,
      sortableColumns: ["id", "created_at", "updated_at", "minutes_played"],
      searchableColumns: ["user.username", "game.title"],
      filterableColumns: {
        id: true,
        created_at: true,
        updated_at: true,
        minutes_played: true,
        "user.id": true,
        "user.username": true,
        "game.id": true,
        "game.metadata.age_rating": true,
      },
      withDeleted: false,
    });
  }

  /** Retrieves a specific progress by its ID. */
  @Get(":progress_id")
  @ApiOperation({
    summary: "get a specific progress by progress id",
    operationId: "getProgressByProgressId",
  })
  @MinimumRole(Role.GUEST)
  @ApiOkResponse({ type: () => Progress, isArray: true })
  async getProgressByProgressId(
    @Param() params: ProgressIdDto,
    @Request() request: { gamevaultuser: GamevaultUser },
  ): Promise<Progress> {
    return this.progressService.findOneByProgressId(
      Number(params.progress_id),
      {
        loadDeletedEntities: true,
        loadRelations: true,
        filterByAge: await this.usersService.findUserAgeByUsername(
          request.gamevaultuser.username,
        ),
      },
    );
  }

  /** Deletes a progress by its ID. */
  @Delete(":progress_id")
  @ApiOperation({
    summary: "delete a progress by progress id.",
    description:
      "Only admins or the user who is associated to the progress can delete it.",
    operationId: "deleteProgressByProgressId",
  })
  @ApiOkResponse({ type: () => Progress, isArray: true })
  @MinimumRole(Role.USER)
  @DisableApiIf(configuration.SERVER.DEMO_MODE_ENABLED)
  async deleteProgressByProgressId(
    @Param() params: ProgressIdDto,
    @Request() req: { gamevaultuser: GamevaultUser },
  ): Promise<Progress> {
    return this.progressService.delete(
      Number(params.progress_id),
      req.gamevaultuser.username,
    );
  }

  /** Get the progress of a specific game for a user. */
  @Get("/user/:user_id/game/:game_id")
  @ApiOperation({
    summary: "get a specific game progress for a user",
    operationId: "getProgressByUserIdAndGameId",
  })
  @MinimumRole(Role.GUEST)
  @ApiOkResponse({ type: () => Progress })
  async getProgressByUserIdAndGameId(
    @Param() params: UserIdGameIdDto,
    @Request() request: { gamevaultuser: GamevaultUser },
  ): Promise<Progress> {
    return this.progressService.findOneByUserIdAndGameIdOrReturnEmptyProgress(
      Number(params.user_id),
      Number(params.game_id),
      {
        loadDeletedEntities: true,
        loadRelations: true,
        filterByAge: await this.usersService.findUserAgeByUsername(
          request.gamevaultuser.username,
        ),
      },
    );
  }

  /** Set progress for a user and game. */
  @Put("/user/:user_id/game/:game_id")
  @ApiBody({ type: () => UpdateProgressDto })
  @ApiOperation({
    summary: "create or update a progress",
    operationId: "putProgressByUserIdAndGameId",
  })
  @ApiOkResponse({ type: () => Progress })
  @MinimumRole(Role.USER)
  async putProgressByUserIdAndGameId(
    @Param() params: UserIdGameIdDto,
    @Body() progress: UpdateProgressDto,
    @Request() req: { gamevaultuser: GamevaultUser },
  ): Promise<Progress> {
    return this.progressService.set(
      Number(params.user_id),
      Number(params.game_id),
      progress,
      req.gamevaultuser.username,
    );
  }

  /**
   * Endpoint to increment the progress for a specific game by one minute for a
   * given user.
   */
  @Put("/user/:user_id/game/:game_id/increment")
  @ApiOperation({
    summary: "Increment a specific game progress for a user by a minute",
    operationId: "putProgressByUserIdAndGameIdIncrementByOne",
  })
  @ApiOkResponse({ type: () => Progress })
  @MinimumRole(Role.USER)
  async putProgressByUserIdAndGameIdIncrementByOne(
    @Param() params: UserIdGameIdDto,
    @Request() req: { gamevaultuser: GamevaultUser },
  ): Promise<Progress> {
    return this.progressService.increment(
      Number(params.user_id),
      Number(params.game_id),
      req.gamevaultuser.username,
    );
  }

  /**
   * Increment a specific game progress for a user by a certain number of
   * minutes.
   */
  @Put("/user/:user_id/game/:game_id/increment/:minutes")
  @ApiOperation({
    summary: "Increment a specific game progress for a user by x minutes",
    operationId: "putProgressByUserIdAndGameIdIncrementByMinutes",
  })
  @ApiOkResponse({ type: () => Progress })
  @MinimumRole(Role.USER)
  async putProgressByUserIdAndGameIdIncrementByMinutes(
    @Param() params: IncrementProgressByMinutesDto,
    @Request() req: { gamevaultuser: GamevaultUser },
  ): Promise<Progress> {
    return this.progressService.increment(
      Number(params.user_id),
      Number(params.game_id),
      req.gamevaultuser.username,
      Number(params.minutes),
    );
  }
}
