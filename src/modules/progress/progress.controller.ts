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
import { IdDto } from "../database/models/id.dto";
import { IncrementProgressByMinutesDto } from "./models/increment-progress-by-minutes.dto";
import { Progress } from "./progress.entity";
import { ProgressService } from "./progress.service";
import { MinimumRole } from "../../decorators/minimum-role.decorator";
import { Role } from "../users/models/role.enum";
import { GamevaultUser } from "../users/gamevault-user.entity";
import { UpdateProgressDto } from "./models/update-progress.dto";
import { UserIdGameIdDto } from "./models/user-id-game-id.dto";
import { DisableApiIf } from "../../decorators/disable-api-if.decorator";
import configuration from "../../configuration";

@Controller("progresses")
@ApiTags("progress")
@ApiBasicAuth()
export class ProgressController {
  private readonly logger = new Logger(ProgressController.name);

  constructor(private progressService: ProgressService) {}

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

  /** Get all progresses for all users and games. */
  @Get("")
  @ApiOperation({
    summary: "get all progresses for all users and games",
    operationId: "getProgresses",
  })
  @MinimumRole(Role.GUEST)
  @ApiOkResponse({ type: () => Progress, isArray: true })
  async getProgresses(): Promise<Progress[]> {
    return await this.progressService.getAll();
  }

  /** Retrieves a specific progress by its ID. */
  @Get(":id")
  @ApiOperation({
    summary: "get a specific progress by progress id",
    operationId: "getProgressByProgressId",
  })
  @MinimumRole(Role.GUEST)
  @ApiOkResponse({ type: () => Progress, isArray: true })
  async getProgressByProgressId(@Param() params: IdDto): Promise<Progress> {
    return await this.progressService.findByProgressId(Number(params.id));
  }

  /** Deletes a progress by its ID. */
  @Delete(":id")
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
    @Param() params: IdDto,
    @Request() req: { gamevaultuser: GamevaultUser },
  ): Promise<Progress> {
    return await this.progressService.delete(
      Number(params.id),
      req.gamevaultuser.username,
    );
  }

  /** Retrieves all progresses for a user by their ID. */
  @Get("/user/:id")
  @ApiOperation({
    summary: "get all progresses for a user",
    operationId: "getProgressesByUserId",
  })
  @MinimumRole(Role.GUEST)
  @ApiOkResponse({ type: () => Progress, isArray: true })
  async getProgressesByUserId(@Param() params: IdDto) {
    return await this.progressService.findByUserId(Number(params.id));
  }

  /** Returns an array of progresses for a game with the given ID. */
  @Get("/game/:id")
  @ApiOperation({
    summary: "get all progresses for a game",
    operationId: "getProgressesByGameId",
  })
  @MinimumRole(Role.GUEST)
  @ApiOkResponse({ type: () => Progress, isArray: true })
  async getProgressesByGameId(@Param() params: IdDto): Promise<Progress[]> {
    return await this.progressService.findByGameId(Number(params.id));
  }

  /** Get the progress of a specific game for a user. */
  @Get("/user/:userId/game/:gameId")
  @ApiOperation({
    summary: "get a specific game progress for a user",
    operationId: "getProgressByUserIdAndGameId",
  })
  @MinimumRole(Role.GUEST)
  @ApiOkResponse({ type: () => Progress })
  async getProgressByUserIdAndGameId(
    @Param() params: UserIdGameIdDto,
  ): Promise<Progress> {
    return await this.progressService.findOrCreateByUserIdAndGameId(
      Number(params.userId),
      Number(params.gameId),
    );
  }

  /** Set progress for a user and game. */
  @Put("/user/:userId/game/:gameId")
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
    return await this.progressService.set(
      Number(params.userId),
      Number(params.gameId),
      progress,
      req.gamevaultuser.username,
    );
  }

  /**
   * Endpoint to increment the progress for a specific game by one minute for a
   * given user.
   */
  @Put("/user/:userId/game/:gameId/increment")
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
    return await this.progressService.increment(
      Number(params.userId),
      Number(params.gameId),
      req.gamevaultuser.username,
    );
  }

  /**
   * Increment a specific game progress for a user by a certain number of
   * minutes.
   */
  @Put("/user/:userId/game/:gameId/increment/:minutes")
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
    return await this.progressService.increment(
      Number(params.userId),
      Number(params.gameId),
      req.gamevaultuser.username,
      Number(params.minutes),
    );
  }
}
