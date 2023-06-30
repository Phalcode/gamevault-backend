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
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { IdDto } from "../dtos/id.dto";
import { IncrementProgressByMinutesDto } from "../dtos/increment-progress-by-minutes.dto";
import { ProgressDto } from "../dtos/progress.dto";
import { UserIdGameIdDto } from "../dtos/user-id-game-id.dto";
import { Progress } from "../database/entities/progress.entity";
import { ProgressService } from "../services/progress.service";
import { MinimumRole } from "../decorators/minimum-role.decorator";
import { Role } from "../models/role.enum";
import { CrackpipeUser } from "../database/entities/crackpipe-user.entity";

@Controller("progresses")
@ApiTags("progress")
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
  @ApiOkResponse({ type: String, isArray: true })
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
  @ApiOkResponse({ type: Progress, isArray: true })
  async getAllProgresses(): Promise<Progress[]> {
    return await this.progressService.getAllProgresses();
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
  @ApiOkResponse({ type: Progress, isArray: true })
  async getProgressById(@Param() params: IdDto): Promise<Progress> {
    return await this.progressService.getProgressById(Number(params.id));
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
      "Only the user who created the progress can delete it. This is a hard deletion and can not be undone.",
    operationId: "deleteProgressById",
  })
  @ApiOkResponse({ type: Progress, isArray: true })
  @MinimumRole(Role.USER)
  async deleteProgressById(
    @Param() params: IdDto,
    @Request() req: { crackpipeuser: CrackpipeUser },
  ): Promise<Progress> {
    return await this.progressService.deleteProgressById(
      Number(params.id),
      req.crackpipeuser.username,
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
  @ApiOkResponse({ type: Progress, isArray: true })
  async getProgressesByUser(@Param() params: IdDto) {
    return await this.progressService.getProgressesByUser(Number(params.id));
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
  @ApiOkResponse({ type: Progress, isArray: true })
  async getProgressesByGame(@Param() params: IdDto): Promise<Progress[]> {
    return await this.progressService.getProgressesByGame(Number(params.id));
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
  @ApiOkResponse({ type: Progress })
  async getProgressByUserAndGame(
    @Param() params: UserIdGameIdDto,
  ): Promise<Progress> {
    return await this.progressService.getProgressByUserAndGame(
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
   * @param req.crackpipeuser.username - The username of the authenticated user.
   * @returns The created or updated progress object.
   * @throws {Error} If there was an error setting the progress.
   */
  @Put("/user/:userId/game/:gameId")
  @ApiBody({ type: ProgressDto })
  @ApiOperation({
    summary: "create or update a progress",
    operationId: "setProgressForUser",
  })
  @ApiOkResponse({ type: Progress })
  @MinimumRole(Role.USER)
  async setProgressForUser(
    @Param() params: UserIdGameIdDto,
    @Body() progress: ProgressDto,
    @Request() req: { crackpipeuser: CrackpipeUser },
  ): Promise<Progress> {
    return await this.progressService.setProgress(
      Number(params.userId),
      Number(params.gameId),
      progress,
      req.crackpipeuser.username,
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
  @ApiOkResponse({ type: Progress })
  @MinimumRole(Role.USER)
  async incrementProgressForUser(
    @Param() params: UserIdGameIdDto,
    @Request() req: { crackpipeuser: CrackpipeUser },
  ): Promise<Progress> {
    return await this.progressService.incrementProgress(
      Number(params.userId),
      Number(params.gameId),
      req.crackpipeuser.username,
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
  @ApiOkResponse({ type: Progress })
  @MinimumRole(Role.USER)
  async incrementProgressForUserByMinutes(
    @Param() params: IncrementProgressByMinutesDto,
    @Request() req: { crackpipeuser: CrackpipeUser },
  ): Promise<Progress> {
    return await this.progressService.incrementProgress(
      Number(params.userId),
      Number(params.gameId),
      req.crackpipeuser.username,
      Number(params.minutes),
    );
  }
}
