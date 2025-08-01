import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { readFile } from "fs-extra";
import path from "path";
import { FindOneOptions, IsNull, LessThanOrEqual, Or, Repository } from "typeorm";

import { FindOptions } from "../../globals";
import { logProgress } from "../../logging";
import { GamesService } from "../games/games.service";
import { UsersService } from "../users/users.service";
import { State } from "./models/state.enum";
import { UpdateProgressDto } from "./models/update-progress.dto";
import { Progress } from "./progress.entity";

@Injectable()
export class ProgressService implements OnApplicationBootstrap {
  private readonly logger = new Logger(this.constructor.name);
  public ignoreList: string[] = [];

  constructor(
    @InjectRepository(Progress)
    private readonly progressRepository: Repository<Progress>,
    private readonly usersService: UsersService,
    private readonly gamesService: GamesService,
  ) {}

  onApplicationBootstrap() {
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

  public async findOneByProgressId(id: number, options: FindOptions) {
    try {
      const findParameters: FindOneOptions<Progress> = {
        where: { id },
        relationLoadStrategy: "query",
      };

      if (options.loadRelations) {
        if (options.loadRelations === true) {
          findParameters.relations = ["user", "game"];
        } else if (Array.isArray(options.loadRelations))
          findParameters.relations = options.loadRelations;
      }

      if (options.loadDeletedEntities) {
        findParameters.withDeleted = true;
      }

      if (options.filterByAge) {
        if (!options.loadRelations) {
          findParameters.relations = ["game"];
        }
        findParameters.where = {
          id,
          game: {
            metadata: { age_rating: Or(LessThanOrEqual(options.filterByAge), IsNull()) },
          },
        };
      }
      return await this.progressRepository.findOneOrFail(findParameters);
    } catch (error) {
      throw new NotFoundException(
        `Progress with id ${id} was not found on the server.`,
        { cause: error },
      );
    }
  }

  public async deleteByProgressId(
    progressId: number,
    executorUsername: string,
  ): Promise<Progress> {
    const progress = await this.findOneByProgressId(progressId, {
      loadDeletedEntities: false,
      loadRelations: ["user"],
    });

    await this.usersService.checkIfUsernameMatchesIdOrIsAdminOrThrow(
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

  public async deleteByUserIdAndGameId(
    userId: number,
    gameId: number,
    executorUsername: string,
  ): Promise<Progress> {
    await this.usersService.checkIfUsernameMatchesIdOrIsAdminOrThrow(
      userId,
      executorUsername,
    );
    const progress = await this.findOneByUserIdAndGameIdOrReturnEmptyProgress(
      userId,
      gameId,
      { loadDeletedEntities: true, loadRelations: true },
    );
    const softRemoveResult = await this.progressRepository.softRemove(progress);
    this.logger.log({
      message: `Soft-deleted progress.`,
      progress,
    });
    return softRemoveResult;
  }

  public async findOneByUserIdAndGameIdOrReturnEmptyProgress(
    userId: number,
    gameId: number,
    options: FindOptions,
  ): Promise<Progress> {
    try {
      const findParameters: FindOneOptions<Progress> = {
        where: {
          user: { id: userId },
          game: { id: gameId },
          deleted_at: IsNull(),
        },
        relationLoadStrategy: "query",
      };

      if (options.loadRelations) {
        if (options.loadRelations === true) {
          findParameters.relations = ["user", "game"];
        } else if (Array.isArray(options.loadRelations))
          findParameters.relations = options.loadRelations;
      }

      if (options.loadDeletedEntities) {
        findParameters.withDeleted = true;
      }

      if (options.filterByAge) {
        if (!options.loadRelations) {
          findParameters.relations = ["game"];
        }
        findParameters.where = {
          user: { id: userId },
          game: {
            id: gameId,
            metadata: { age_rating: Or(LessThanOrEqual(options.filterByAge), IsNull()) },
          },
        };
      }

      return await this.progressRepository.findOneOrFail(findParameters);
    } catch {
      const newProgress = new Progress();
      newProgress.user = await this.usersService.findOneByUserIdOrFail(userId, {
        loadDeletedEntities: true,
        loadRelations: false,
      });
      newProgress.game = await this.gamesService.findOneByGameIdOrFail(gameId, {
        loadDeletedEntities: true,
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
    await this.usersService.checkIfUsernameMatchesIdOrIsAdminOrThrow(
      userId,
      executorUsername,
    );

    const progress = await this.findOneByUserIdAndGameIdOrReturnEmptyProgress(
      userId,
      gameId,
      { loadDeletedEntities: true, loadRelations: true },
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
          progress: logProgress(progress),
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
    this.logger.log({
      message: `Updating progress.`,
      progress: logProgress(progress),
    });
    return this.progressRepository.save(progress);
  }

  public async increment(
    userId: number,
    gameId: number,
    executorUsername: string,
    incrementBy = 1,
  ): Promise<Progress> {
    await this.usersService.checkIfUsernameMatchesIdOrIsAdminOrThrow(
      userId,
      executorUsername,
    );
    const progress = await this.findOneByUserIdAndGameIdOrReturnEmptyProgress(
      userId,
      gameId,
      { loadDeletedEntities: true, loadRelations: true },
    );
    if (
      progress.state !== State.INFINITE &&
      progress.state !== State.COMPLETED
    ) {
      this.logger.debug({
        message: `Automatically setting progress state to "${State.PLAYING}".`,
        reason: "Current state is not 'INFINITE' or 'COMPLETED'",
        progress: logProgress(progress),
      });
      progress.state = State.PLAYING;
    }
    this.logger.log({
      message: `Incrementing progress by ${incrementBy} minute(s).`,
      progress: logProgress(progress),
    });
    progress.last_played_at = new Date();
    progress.minutes_played += incrementBy;
    return this.progressRepository.save(progress);
  }
}
