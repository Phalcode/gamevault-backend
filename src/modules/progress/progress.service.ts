import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Progress } from "./progress.entity";
import { State } from "./models/state.enum";
import { GamesService } from "../games/games.service";
import { UsersService } from "../users/users.service";
import path from "path";
import * as fs from "fs";
import { ProgressDto } from "./models/progress.dto";

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);
  public ignoreList = [];

  constructor(
    @InjectRepository(Progress)
    private progressRepository: Repository<Progress>,
    private usersService: UsersService,
    private gamesService: GamesService,
  ) {
    this.readIgnoreFile();
  }

  /**
   * Reads the .progressignore file and updates the ignoreList property.
   *
   * @private
   */
  private readIgnoreFile() {
    try {
      const filePath = path.join(__dirname, "../../../static/.progressignore");
      const fileContent = fs.readFileSync(filePath, "utf-8");
      this.ignoreList = fileContent.split("\n").map((line) => line.trim());
    } catch (error) {
      throw new InternalServerErrorException(
        error,
        "Error reading .progressignore file",
      );
    }
  }

  /**
   * Retrieves all progresses from the database.
   *
   * @returns - Array of progresses.
   */
  public async getAllProgresses() {
    const progresses = await this.progressRepository.find({
      relations: ["game", "user"],
      order: { minutes_played: "DESC" },
      withDeleted: true,
    });
    return this.filterEmptyProgresses(progresses);
  }

  /**
   * Retrieves a progress by its ID from the database.
   *
   * @param progressId - The ID of the progress.
   * @returns - The progress object.
   * @throws {NotFoundException} - If the progress cannot be found.
   */
  public async getProgressById(progressId: number) {
    return this.progressRepository
      .findOneOrFail({
        where: { id: progressId },
        relations: ["game", "user"],
        order: { minutes_played: "DESC" },
        withDeleted: true,
      })
      .catch(() => {
        throw new NotFoundException(
          `Progress with id ${progressId} was not found on the server.`,
        );
      });
  }

  /**
   * Deletes a progress by its ID.
   *
   * @param progressId - The ID of the progress to be deleted.
   * @param executorUsername - The username of the user deleting the progress.
   * @returns
   * @throws {NotFoundException} - If the progress cannot be found.
   */
  public async deleteProgressById(
    progressId: number,
    executorUsername: string,
  ): Promise<Progress> {
    const progress = await this.getProgressById(progressId);

    await this.usersService.checkIfUsernameMatchesId(
      progress.user.id,
      executorUsername,
    );

    this.logger.log(
      `Deleting progress with id "${progressId}" for user "${executorUsername}"`,
    );
    return this.progressRepository.softRemove(progress);
  }

  /**
   * Retrieves all progresses for a given user.
   *
   * @param userId - The ID of the user.
   * @returns - Array of progresses.
   */
  public async getProgressesByUser(userId: number) {
    const progresses = await this.progressRepository.find({
      where: { user: { id: userId } },
      relations: ["game"],
      withDeleted: true,
      order: { minutes_played: "DESC" },
    });
    return this.filterEmptyProgresses(progresses);
  }

  /**
   * Retrieves all progresses for a given game.
   *
   * @param gameId - The ID of the game.
   * @returns - Array of progresses.
   */
  public async getProgressesByGame(gameId: number): Promise<Progress[]> {
    const progresses = await this.progressRepository.find({
      where: { game: { id: gameId } },
      relations: ["user"],
      withDeleted: true,
      order: { minutes_played: "DESC" },
    });
    return this.filterEmptyProgresses(progresses);
  }

  /**
   * Retrieves all progresses for a given game and user.
   *
   * @param userId - The ID of the user.
   * @param gameId - The ID of the game.
   * @returns - The requested progress.
   */
  public async getProgressByUserAndGame(
    userId: number,
    gameId: number,
  ): Promise<Progress> {
    let progress = await this.progressRepository.findOne({
      where: {
        user: { id: userId },
        game: { id: gameId },
      },
      withDeleted: true,
    });

    if (!progress) {
      progress = new Progress();
      progress.user = await this.usersService.getUserByIdOrFail(userId);
      progress.game = await this.gamesService.getGameById(gameId);
      progress.state = State.UNPLAYED;
      progress.minutes_played = 0;
    }

    return progress;
  }

  /**
   * Sets the progress of a specific user for a specific game.
   *
   * @param userId - The ID of the user.
   * @param gameId - The ID of the game.
   * @param progressDto - The ProgressDto object that contains the new progress
   *   information.
   * @param executorUsername - The username of the user performing the update.
   * @returns The saved progress object.
   * @throws {ConflictException} If the new value for minutes_played is less
   *   than the previous value.
   */
  public async setProgress(
    userId: number,
    gameId: number,
    progressDto: ProgressDto,
    executorUsername: string,
  ) {
    await this.usersService.checkIfUsernameMatchesId(userId, executorUsername);

    const progress = await this.getProgressByUserAndGame(userId, gameId);

    progress.state = progressDto.state;
    if (progress.minutes_played > progressDto.minutes_played) {
      throw new ConflictException(
        `New value for "minutes_played" cannot be less than previous value: ${progress.minutes_played} minutes`,
      );
    }
    if (progress.minutes_played != progressDto.minutes_played) {
      if (
        progress.state !== State.INFINITE &&
        progress.state !== State.COMPLETED
      ) {
        progress.state = State.PLAYING;
      }
      progress.minutes_played = progressDto.minutes_played;
      progress.last_played_at = new Date();
    }
    this.logger.log(`Updated progress for user ${userId} and game ${gameId}`);
    return this.progressRepository.save(progress);
  }

  /**
   * Increments the progress of a specific user for a specific game by a
   * specified amount.
   *
   * @param userId - The ID of the user.
   * @param gameId - The ID of the game.
   * @param executorUsername - The username of the user performing the update.
   * @param incrementBy - The amount to increment by (default is 1).
   * @returns The saved progress object.
   */
  public async incrementProgress(
    userId: number,
    gameId: number,
    executorUsername: string,
    incrementBy = 1,
  ): Promise<Progress> {
    await this.usersService.checkIfUsernameMatchesId(userId, executorUsername);
    const progress = await this.getProgressByUserAndGame(userId, gameId);
    if (
      progress.state !== State.INFINITE &&
      progress.state !== State.COMPLETED
    ) {
      progress.state = State.PLAYING;
    }
    progress.last_played_at = new Date();
    progress.minutes_played += incrementBy;
    this.logger.log(
      `Incremented progress for user ${userId} and game ${gameId} by ${incrementBy} minute(s)`,
    );
    return this.progressRepository.save(progress);
  }

  /**
   * Filters out any progress objects from the given array that have 0 minutes
   * played or are in the UNPLAYED state.
   *
   * @param progresses - An array of Progress objects.
   * @returns An array of Progress objects that have minutes_played > 0 and are
   *   not in the UNPLAYED state.
   */
  private async filterEmptyProgresses(progresses: Progress[]) {
    return progresses.filter(
      (progress) =>
        progress.minutes_played > 0 && progress.state !== State.UNPLAYED,
    );
  }
}
