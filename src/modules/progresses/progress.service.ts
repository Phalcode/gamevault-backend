import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { readFile } from "fs/promises";
import path from "path";
import { IsNull, Repository } from "typeorm";

import { GamesService } from "../games/games.service";
import { UsersService } from "../users/users.service";
import { State } from "./models/state.enum";
import { UpdateProgressDto } from "./models/update-progress.dto";
import { Progress } from "./progress.entity";

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(this.constructor.name);
  public ignoreList: string[] = [];

  constructor(
    @InjectRepository(Progress)
    private progressRepository: Repository<Progress>,
    private usersService: UsersService,
    private gamesService: GamesService,
  ) {
    this.readIgnoreFile();
  }

  private async readIgnoreFile() {
    try {
      const filePath = path.join(
        __dirname,
        "../../../assets/ignored-executables.txt",
      );
      const fileContent = await readFile(filePath, "utf-8");
      this.ignoreList = fileContent.split("\n").map((line) => line.trim());
    } catch (error) {
      throw new InternalServerErrorException(
        "Error reading ignored-executables.txt file",
        { cause: error },
      );
    }
  }

  public async find() {
    return this.progressRepository.find({
      where: {
        deleted_at: IsNull(),
      },
      relations: ["game", "user"],
      order: { minutes_played: "DESC" },
      withDeleted: true,
    });
  }

  public async findOneByProgressId(progressId: number) {
    try {
      return await this.progressRepository.findOneOrFail({
        where: {
          id: progressId,
        },
        relations: ["game", "user"],
        order: { minutes_played: "DESC" },
        withDeleted: true,
      });
    } catch (error) {
      throw new NotFoundException(
        `Progress with id ${progressId} was not found on the server.`,
        { cause: error },
      );
    }
  }

  public async delete(
    progressId: number,
    executorUsername: string,
  ): Promise<Progress> {
    const progress = await this.findOneByProgressId(progressId);

    await this.usersService.checkIfUsernameMatchesIdOrIsAdmin(
      progress.user.id,
      executorUsername,
    );

    const softRemoveResult = await this.progressRepository.softRemove(progress);
    this.logger.log({
      message: `Soft-deleted progress.`,
      progress,
    });
    return softRemoveResult;
  }

  public async findOneByUserId(userId: number) {
    return this.progressRepository.find({
      order: { minutes_played: "DESC" },
      where: {
        user: { id: userId },
        deleted_at: IsNull(),
      },
      relations: ["game"],
      withDeleted: true,
    });
  }

  public async findOneByGameId(gameId: number): Promise<Progress[]> {
    return this.progressRepository.find({
      where: {
        game: { id: gameId },
        deleted_at: IsNull(),
      },
      relations: ["user"],
      withDeleted: true,
      order: { minutes_played: "DESC" },
    });
  }

  public async findOneByUserIdAndGameIdOrReturnEmptyProgress(
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
      newProgress.user = await this.usersService.findOneByUserIdOrFail(userId, {
        loadDeletedEntities: true,
        loadRelations: false,
      });
      newProgress.game = await this.gamesService.findOneByGameIdOrFail(gameId, {
        loadDeletedEntities: true,
        loadRelations: false,
      });
      newProgress.minutes_played = 0;
      newProgress.state = State.UNPLAYED;
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

    const progress = await this.findOneByUserIdAndGameIdOrReturnEmptyProgress(
      userId,
      gameId,
    );

    if (updateProgressDto.state != null) {
      progress.state = updateProgressDto.state;
      if (
        updateProgressDto.state === State.UNPLAYED &&
        progress.id &&
        !progress.minutes_played &&
        !updateProgressDto.minutes_played
      ) {
        const deleteResult = await this.progressRepository.remove(progress);
        this.logger.log({
          message: `Deleted empty progress.`,
          progress,
        });
        return deleteResult;
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
    this.logger.log({ message: `Updating progress.`, progress });
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
    const progress = await this.findOneByUserIdAndGameIdOrReturnEmptyProgress(
      userId,
      gameId,
    );
    if (
      progress.state !== State.INFINITE &&
      progress.state !== State.COMPLETED
    ) {
      this.logger.debug({
        message: `Automatically setting progress state to "${State.PLAYING}".`,
        reason: "Current state is not 'INFINITE' or 'COMPLETED'",
        progress,
      });
      progress.state = State.PLAYING;
    }
    this.logger.log({
      message: `Incrementing progress by ${incrementBy} minute(s).`,
      progress,
    });
    progress.last_played_at = new Date();
    progress.minutes_played += incrementBy;
    return this.progressRepository.save(progress);
  }
}
