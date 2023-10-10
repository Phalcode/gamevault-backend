import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { Progress } from "./progress.entity";
import { State } from "./models/state.enum";
import { GamesService } from "../games/games.service";
import { UsersService } from "../users/users.service";
import path from "path";
import * as fs from "fs";
import { UpdateProgressDto } from "./models/update-progress.dto";

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

  public async getAll() {
    return await this.progressRepository.find({
      where: {
        deleted_at: IsNull(),
      },
      relations: ["game", "user"],
      order: { minutes_played: "DESC" },
      withDeleted: true,
    });
  }

  public async getById(progressId: number) {
    try {
      return await this.progressRepository.findOneOrFail({
        where: {
          id: progressId,
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

  public async delete(
    progressId: number,
    executorUsername: string,
  ): Promise<Progress> {
    const progress = await this.getById(progressId);

    await this.usersService.checkIfUsernameMatchesIdOrIsAdmin(
      progress.user.id,
      executorUsername,
    );

    this.logger.log(
      `Deleting progress with id "${progressId}" for user "${executorUsername}"`,
    );
    return this.progressRepository.softRemove(progress);
  }

  public async findByUserId(userId: number) {
    return await this.progressRepository.find({
      order: { minutes_played: "DESC" },
      where: {
        user: { id: userId },
        deleted_at: IsNull(),
      },
      relations: ["game"],
      withDeleted: true,
    });
  }

  public async findByGameId(gameId: number): Promise<Progress[]> {
    return await this.progressRepository.find({
      where: {
        game: { id: gameId },
        deleted_at: IsNull(),
      },
      relations: ["user"],
      withDeleted: true,
      order: { minutes_played: "DESC" },
    });
  }

  public async findOrCreateByUserIdAndGameId(
    userId: number,
    gameId: number,
  ): Promise<Progress> {
    try {
      return await this.progressRepository.findOneOrFail({
        where: {
          user: { id: userId },
          game: { id: gameId },
          deleted_at: IsNull(),
        },
        withDeleted: true,
      });
    } catch (error) {
      const newProgress = new Progress();
      newProgress.user = await this.usersService.getByIdOrFail(userId);
      newProgress.game = await this.gamesService.getByIdOrFail(gameId);
      return newProgress;
    }
  }

  public async set(
    userId: number,
    gameId: number,
    updateProgressDto: UpdateProgressDto,
    executorUsername: string,
  ) {
    await this.usersService.checkIfUsernameMatchesIdOrIsAdmin(
      userId,
      executorUsername,
    );

    const progress = await this.findOrCreateByUserIdAndGameId(userId, gameId);

    if (updateProgressDto.state != null) {
      progress.state = updateProgressDto.state;
      if (
        updateProgressDto.state === State.UNPLAYED &&
        progress.id &&
        !progress.minutes_played &&
        !updateProgressDto.minutes_played
      ) {
        this.progressRepository.remove(progress);
        this.logger.log(
          `Deleted empty progress for user ${userId} and game ${gameId}`,
        );
        return;
      }
    }

    if (updateProgressDto.minutes_played != null) {
      if (progress.minutes_played > updateProgressDto.minutes_played) {
        throw new ConflictException(
          `New value for "minutes_played" cannot be less than previous value: ${progress.minutes_played} minutes`,
        );
      }
      if (progress.minutes_played !== updateProgressDto.minutes_played) {
        if (
          progress.state !== State.INFINITE &&
          progress.state !== State.COMPLETED
        ) {
          progress.state = State.PLAYING;
        }
        progress.minutes_played = updateProgressDto.minutes_played;
        progress.last_played_at = new Date();
      }
    }
    this.logger.log(`Updated progress for user ${userId} and game ${gameId}`);
    return this.progressRepository.save(progress);
  }

  public async increment(
    userId: number,
    gameId: number,
    executorUsername: string,
    incrementBy = 1,
  ): Promise<Progress> {
    await this.usersService.checkIfUsernameMatchesIdOrIsAdmin(
      userId,
      executorUsername,
    );
    const progress = await this.findOrCreateByUserIdAndGameId(userId, gameId);
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
