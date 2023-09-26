import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, MoreThan, Not, Repository } from "typeorm";
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
  public ignoreList: string[] = [];

  constructor(
    @InjectRepository(Progress)
    private progressRepository: Repository<Progress>,
    private usersService: UsersService,
    private gamesService: GamesService,
  ) {
    this.readIgnoreFile();
  }

  private readIgnoreFile() {
    try {
      const filePath = path.join(
        __dirname,
        "../../../assets/ignored-executables.txt",
      );
      const fileContent = fs.readFileSync(filePath, "utf-8");
      this.ignoreList = fileContent.split("\n").map((line) => line.trim());
    } catch (error) {
      throw new InternalServerErrorException(
        error,
        "Error reading ignored-executables.txt file",
      );
    }
  }

  public async getAllProgresses() {
    return await this.progressRepository.find({
      where: {
        minutes_played: MoreThan(0),
        state: Not(State.UNPLAYED),
        deleted_at: IsNull(),
      },
      relations: ["game", "user"],
      order: { minutes_played: "DESC" },
      withDeleted: true,
    });
  }

  public async getProgressById(progressId: number) {
    try {
      return await this.progressRepository.findOneOrFail({
        where: {
          id: progressId,
          minutes_played: MoreThan(0),
          state: Not(State.UNPLAYED),
          deleted_at: IsNull(),
        },
        relations: ["game", "user"],
        order: { minutes_played: "DESC" },
        withDeleted: true,
      });
    } catch {
      throw new NotFoundException(
        `Progress with id ${progressId} was not found on the server.`,
      );
    }
  }

  public async deleteProgressById(
    progressId: number,
    executorUsername: string,
  ): Promise<Progress> {
    const progress = await this.getProgressById(progressId);

    await this.usersService.checkIfUsernameMatchesIdOrIsAdmin(
      progress.user.id,
      executorUsername,
    );

    this.logger.log(
      `Deleting progress with id "${progressId}" for user "${executorUsername}"`,
    );
    return this.progressRepository.softRemove(progress);
  }

  public async getProgressesByUser(userId: number) {
    return await this.progressRepository.find({
      order: { minutes_played: "DESC" },
      where: {
        user: { id: userId },
        minutes_played: MoreThan(0),
        state: Not(State.UNPLAYED),
        deleted_at: IsNull(),
      },
      relations: ["game"],
      withDeleted: true,
    });
  }

  public async getProgressesByGame(gameId: number): Promise<Progress[]> {
    return await this.progressRepository.find({
      where: {
        game: { id: gameId },
        minutes_played: MoreThan(0),
        state: Not(State.UNPLAYED),
        deleted_at: IsNull(),
      },
      relations: ["user"],
      withDeleted: true,
      order: { minutes_played: "DESC" },
    });
  }

  public async getProgressByUserAndGame(
    userId: number,
    gameId: number,
  ): Promise<Progress> {
    let progress = await this.progressRepository.findOne({
      where: {
        user: { id: userId },
        game: { id: gameId },
        minutes_played: MoreThan(0),
        state: Not(State.UNPLAYED),
        deleted_at: IsNull(),
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

  public async setProgress(
    userId: number,
    gameId: number,
    progressDto: ProgressDto,
    executorUsername: string,
  ) {
    await this.usersService.checkIfUsernameMatchesIdOrIsAdmin(
      userId,
      executorUsername,
    );

    const progress = await this.getProgressByUserAndGame(userId, gameId);

    progress.state = progressDto.state;
    if (progress.minutes_played > progressDto.minutes_played) {
      throw new ConflictException(
        `New value for "minutes_played" cannot be less than previous value: ${progress.minutes_played} minutes`,
      );
    }
    if (progress.minutes_played !== progressDto.minutes_played) {
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

  public async incrementProgress(
    userId: number,
    gameId: number,
    executorUsername: string,
    incrementBy = 1,
  ): Promise<Progress> {
    await this.usersService.checkIfUsernameMatchesIdOrIsAdmin(
      userId,
      executorUsername,
    );
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
}
