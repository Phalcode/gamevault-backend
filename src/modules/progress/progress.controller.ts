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
import { MinimumRole } from "../pagination/minimum-role.decorator";
import { Role } from "../users/models/role.enum";
import { GamevaultUser } from "../users/gamevault-user.entity";
import { UpdateProgressDto } from "./models/update-progress.dto";
import { UserIdGameIdDto } from "./models/user-id-game-id.dto";

@Controller("progresses")
@ApiTags("progress")
@ApiBasicAuth()
export class ProgressController {
  private readonly logger = new Logger(ProgressController.name);

  constructor(private progressService: ProgressService) {}

  /**
   * Get an array of files to ignore for progress-tracking.
   *
   * @returns An array of files to ignore.
   */
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

  /**
   * Get all progresses for all users and games.
   *
   * @returns A Promise that resolves to an array of Progress objects.
   */
  @Get("")
  @ApiOperation({
    summary: "get all progresses for all users and games",
    operationId: "getAllProgresses",
  })
  @MinimumRole(Role.GUEST)
  @ApiOkResponse({ type: () => Progress, isArray: true })
  async getAll(): Promise<Progress[]> {
    return await this.progressService.getAll();
  }

  /**
   * Retrieves a specific progress by its ID.
   *
   * @param params - The parameters containing the ID of the progress to
   *   retrieve.
   * @returns - A Promise resolving to an array of Progress objects that match
   *   the specified ID.
   * @throws {Error} - If there is an error retrieving the progress.
   */
  @Get(":id")
  @ApiOperation({
    summary: "get a specific progress by progress id",
    operationId: "getProgressById",
  })
  @MinimumRole(Role.GUEST)
  @ApiOkResponse({ type: () => Progress, isArray: true })
  async getById(@Param() params: IdDto): Promise<Progress> {
    return await this.progressService.getById(Number(params.id));
  }

  /**
   * Deletes a progress by its ID.
   *
   * @param params - The request parameters containing the ID of the progress to
   *   delete.
   * @param req - The request object, containing the username of the
   *   authenticated user.
   * @returns - A Promise that resolves to an array of the remaining Progress
   *   objects.
   */
  @Delete(":id")
  @ApiOperation({
    summary: "delete a progress by progress id.",
    description:
      "Only admins or the user who is associated to the progress can delete it.",
    operationId: "deleteProgressById",
  })
  @ApiOkResponse({ type: () => Progress, isArray: true })
  @MinimumRole(Role.USER)
  async deleteById(
    @Param() params: IdDto,
    @Request() req: { gamevaultuser: GamevaultUser },
  ): Promise<Progress> {
    return await this.progressService.delete(
      Number(params.id),
      req.gamevaultuser.username,
    );
  }

  /**
   * Retrieves all progresses for a user by their ID.
   *
   * @param params The request parameters, containing the user ID.
   * @returns An array of Progress objects.
   */
  @Get("/user/:id")
  @ApiOperation({
    summary: "get all progresses for a user",
    operationId: "getProgressesByUser",
  })
  @MinimumRole(Role.GUEST)
  @ApiOkResponse({ type: () => Progress, isArray: true })
  async getByUserId(@Param() params: IdDto) {
    return await this.progressService.findByUserId(Number(params.id));
  }

  /**
   * Returns an array of progresses for a game with the given ID.
   *
   * @param params - The object containing the game ID.
   * @param params.id - The ID of the game to retrieve progresses for.
   * @returns A promise that resolves to an array of Progress objects.
   */
  @Get("/game/:id")
  @ApiOperation({
    summary: "get all progresses for a game",
    operationId: "getProgressesByGame",
  })
  @MinimumRole(Role.GUEST)
  @ApiOkResponse({ type: () => Progress, isArray: true })
  async getByGameId(@Param() params: IdDto): Promise<Progress[]> {
    return await this.progressService.findByGameId(Number(params.id));
  }

  /**
   * Get the progress of a specific game for a user.
   *
   * @param params - The parameters object containing the user ID and game ID.
   * @param params.userId - The user ID.
   * @param params.gameId - The game ID.
   * @returns The progress of the specified game for the user.
   * @throws {NotFoundException} If no progress is found for the specified user
   *   and game.
   */
  @Get("/user/:userId/game/:gameId")
  @ApiOperation({
    summary: "get a specific game progress for a user",
    operationId: "getProgressByUserAndGame",
  })
  @MinimumRole(Role.GUEST)
  @ApiOkResponse({ type: () => Progress })
  async findByUserAndGameOrFail(
    @Param() params: UserIdGameIdDto,
  ): Promise<Progress> {
    return await this.progressService.findOrCreateByUserIdAndGameId(
      Number(params.userId),
      Number(params.gameId),
    );
  }

  /**
   * Set progress for a user and game.
   *
   * @param params - Parameters from the request URL.
   * @param params.userId - The ID of the user.
   * @param params.gameId - The ID of the game.
   * @param progress - The progress data to set.
   * @param req - The request object.
   * @param req.gamevaultuser.username - The username of the authenticated user.
   * @returns The created or updated progress object.
   * @throws {Error} If there was an error setting the progress.
   */
  @Put("/user/:userId/game/:gameId")
  @ApiBody({ type: () => UpdateProgressDto })
  @ApiOperation({
    summary: "create or update a progress",
    operationId: "setProgressForUser",
  })
  @ApiOkResponse({ type: () => Progress })
  @MinimumRole(Role.USER)
  async set(
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
   *
   * @param params - The parameters for the request containing the user ID and
   *   game ID.
   * @param req - The request object containing the username of the
   *   authenticated user.
   * @returns A Promise that resolves to the updated progress object for the
   *   specified user and game.
   */
  @Put("/user/:userId/game/:gameId/increment")
  @ApiOperation({
    summary: "Increment a specific game progress for a user by a minute",
    operationId: "incrementProgressForUser",
  })
  @ApiOkResponse({ type: () => Progress })
  @MinimumRole(Role.USER)
  async incrementByOne(
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
   *
   * @param params - An object containing userId, gameId, and minutes
   *   properties.
   * @param params.userId - The user ID for which to increment the progress.
   * @param params.gameId - The game ID for which to increment the progress.
   * @param params.minutes - The number of minutes to increment the progress by.
   * @param req - The HTTP request object.
   * @returns - A Promise that resolves to the updated progress object.
   */
  @Put("/user/:userId/game/:gameId/increment/:minutes")
  @ApiOperation({
    summary: "Increment a specific game progress for a user by x minutes",
    operationId: "incrementProgressForUserByMinutes",
  })
  @ApiOkResponse({ type: () => Progress })
  @MinimumRole(Role.USER)
  async incrementProgressForUserByMinutes(
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
