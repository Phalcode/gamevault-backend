import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { compareSync, hashSync } from "bcrypt";
import { validate } from "class-validator";
import { randomBytes } from "crypto";
import { FindManyOptions, ILike, IsNull, Not, Repository } from "typeorm";

import configuration from "../../configuration";
import { FindOptions } from "../../globals";
import { GamesService } from "../games/games.service";
import { MediaService } from "../media/media.service";
import { GamevaultUser } from "./gamevault-user.entity";
import { RegisterUserDto } from "./models/register-user.dto";
import { Role } from "./models/role.enum";
import { UpdateUserDto } from "./models/update-user.dto";

@Injectable()
export class UsersService implements OnApplicationBootstrap {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectRepository(GamevaultUser)
    private userRepository: Repository<GamevaultUser>,
    @Inject(forwardRef(() => MediaService))
    private mediaService: MediaService,
    @Inject(forwardRef(() => GamesService))
    private gamesService: GamesService,
  ) {}

  async onApplicationBootstrap() {
    await this.recoverAdmin();
  }

  private async recoverAdmin() {
    try {
      if (!configuration.SERVER.ADMIN_USERNAME) {
        return;
      }

      const user = await this.findOneByUsernameOrFail(
        configuration.SERVER.ADMIN_USERNAME,
      );

      await this.update(
        user.id,
        {
          role: Role.ADMIN,
          activated: true,
          password: configuration.SERVER.ADMIN_PASSWORD || undefined,
        },
        true,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn({
          message: `The admin user wasn't recovered.`,
          reason: `The admin user "${configuration.SERVER.ADMIN_USERNAME}" could not be found in the database. Make sure to register the user first.`,
          error,
        });
      } else {
        this.logger.error({ message: "Error recovering admin user.", error });
      }
    }
  }

  /**
   * Retrieves a user by their ID or throws an exception if the user is not
   * found.
   */
  public async findOneByUserIdOrFail(
    id: number,
    options: FindOptions = { loadRelations: true, loadDeletedEntities: true },
  ): Promise<GamevaultUser> {
    let relations = [];

    if (options.loadRelations) {
      if (options.loadRelations === true) {
        relations = [
          "progresses",
          "progresses.game",
          "progresses.game.metadata",
          "progresses.game.metadata.cover",
          "bookmarked_games",
        ];
      } else if (Array.isArray(options.loadRelations))
        relations = options.loadRelations;
    }

    const user = await this.userRepository
      .findOneOrFail({
        where: {
          id,
          deleted_at: options.loadDeletedEntities ? undefined : IsNull(),
        },
        relations,
        withDeleted: true,
        relationLoadStrategy: "query",
      })
      .catch((error) => {
        throw new NotFoundException(`User with id ${id} was not found.`, {
          cause: error,
        });
      });
    return this.filterDeletedProgresses(user);
  }

  /** Get user by username or throw an exception if not found */
  public async findOneByUsernameOrFail(
    username: string,
    options: FindOptions = { loadRelations: true, loadDeletedEntities: true },
  ): Promise<GamevaultUser> {
    let relations = [];

    if (options.loadRelations) {
      if (options.loadRelations === true) {
        relations = ["progresses", "progresses.game", "bookmarked_games"];
      } else if (Array.isArray(options.loadRelations))
        relations = options.loadRelations;
    }

    const user = await this.userRepository
      .findOneOrFail({
        where: {
          username: ILike(username),
          deleted_at: options.loadDeletedEntities ? undefined : IsNull(),
        },

        relations,
        withDeleted: true,
      })
      .catch((error) => {
        throw new NotFoundException(
          `User with username ${username} was not found on the server.`,
          {
            cause: error,
          },
        );
      });
    return this.filterDeletedProgresses(user);
  }

  public async find(includeHidden: boolean = false): Promise<GamevaultUser[]> {
    const query: FindManyOptions<GamevaultUser> = {
      order: { id: "ASC" },
      withDeleted: includeHidden,
      where: includeHidden
        ? undefined
        : { activated: true, username: Not(ILike("gvbot_%")) },
    };

    return this.userRepository.find(query);
  }

  /** Register a new user */
  public async register(dto: RegisterUserDto): Promise<GamevaultUser> {
    await this.throwIfAlreadyExists(dto.username, dto.email);
    const isFirstUser = (await this.userRepository.count()) === 0;
    const isAdministrator =
      dto.username === configuration.SERVER.ADMIN_USERNAME || isFirstUser;
    const isActivated =
      configuration.SERVER.ACCOUNT_ACTIVATION_DISABLED || isAdministrator;

    const user = new GamevaultUser();
    user.username = dto.username;
    user.password = hashSync(dto.password, 10);
    user.socket_secret = randomBytes(32).toString("hex");
    user.first_name = dto.first_name || undefined;
    user.last_name = dto.last_name || undefined;
    user.email = dto.email || undefined;
    user.activated = isActivated;
    user.role = isAdministrator ? Role.ADMIN : undefined;

    const registeredUser = await this.userRepository.save(user);
    registeredUser.password = "**REDACTED**";
    registeredUser.socket_secret = "**REDACTED**";
    this.logger.log({
      message: `User has been registered.`,
      user: registeredUser,
    });
    return registeredUser;
  }

  /** Logs in a user with the provided username and password. */
  public async login(
    username: string,
    password: string,
  ): Promise<GamevaultUser> {
    const user = await this.userRepository
      .findOneOrFail({
        where: { username: ILike(username) },
        select: ["username", "password", "activated", "role", "deleted_at"],
        withDeleted: true,
        loadEagerRelations: false,
      })
      .catch((error) => {
        throw new UnauthorizedException(
          `Login Failed: User "${username}" not found.`,
          {
            cause: error,
          },
        );
      });
    if (!compareSync(password, user.password)) {
      throw new UnauthorizedException("Login Failed: Incorrect Password");
    }
    delete user.password;
    if (user.deleted_at) {
      throw new NotFoundException("Login Failed: User has been deleted");
    }
    if (!user.activated && user.role !== Role.ADMIN) {
      throw new ForbiddenException(
        "Login Failed: User is not activated. Contact an Administrator to activate the User.",
      );
    }
    return user;
  }

  /** Updates an existing user with the specified ID. */
  public async update(
    id: number,
    dto: UpdateUserDto,
    admin = false,
  ): Promise<GamevaultUser> {
    const user = await this.findOneByUserIdOrFail(id);
    const logUpdate = (property: string, from: string, to: string) => {
      this.logger.log({
        message: "Updating user property",
        user: user.username,
        property,
        from,
        to,
      });
    };

    if (admin && dto.role != null) {
      logUpdate("role", user.role.toString(), dto.role.toString());
      user.role = dto.role;
    }

    if (admin && dto.activated != null) {
      logUpdate(
        "activated",
        user.activated.toString(),
        dto.activated.toString(),
      );
      user.activated = dto.activated;
      this.logger.log({
        message: { message: "User has been activated.", user: user.username },
      });
    }

    if (dto.username != null && dto.username !== user.username) {
      logUpdate("username", user.username, dto.username);
      await this.updateUsername(dto, user);
    }

    if (dto.email != null && dto.email !== user.email) {
      logUpdate("email", user.email, dto.email);
      await this.updateEmail(dto, user);
    }

    if (dto.first_name != null) {
      logUpdate("first_name", user.first_name, dto.first_name);
      user.first_name = dto.first_name;
    }

    if (dto.last_name != null) {
      logUpdate("last_name", user.last_name, dto.last_name);
      user.last_name = dto.last_name;
    }

    if (dto.birth_date != null) {
      logUpdate(
        "birth_date",
        user.birth_date?.toISOString(),
        dto.birth_date.toISOString(),
      );
      await this.updateBirthDate(dto, user);
    }

    if (dto.password != null) {
      logUpdate("password", user.password, "**REDACTED**");
      user.password = hashSync(dto.password, 10);
    }

    if (dto.avatar_id != null) {
      const image = await this.mediaService.findOneByMediaIdOrFail(
        dto.avatar_id,
      );
      logUpdate("avatar_id", user.avatar?.id.toString(), image.id.toString());
      user.avatar = image;
    }

    if (dto.background_id != null) {
      const image = await this.mediaService.findOneByMediaIdOrFail(
        dto.background_id,
      );
      logUpdate(
        "background_id",
        user.background?.id.toString(),
        image.id.toString(),
      );
      user.background = image;
    }

    await validate(user);

    return this.userRepository.save(user);
  }

  private async updateUsername(
    dto: UpdateUserDto,
    user: GamevaultUser,
  ): Promise<void> {
    if (dto.username?.toLowerCase() !== user.username?.toLowerCase()) {
      await this.throwIfAlreadyExists(dto.username, undefined);
    }
    user.username = dto.username;
  }

  private async updateEmail(
    dto: UpdateUserDto,
    user: GamevaultUser,
  ): Promise<void> {
    if (dto.email?.toLowerCase() !== user.email?.toLowerCase()) {
      await this.throwIfAlreadyExists(undefined, dto.email);
    }
    user.email = dto.email;
  }

  private async updateBirthDate(
    dto: UpdateUserDto,
    user: GamevaultUser,
  ): Promise<void> {
    if (
      configuration.PARENTAL.AGE_RESTRICTION_ENABLED &&
      this.calculateAge(user.birth_date) <
        configuration.PARENTAL.AGE_OF_MAJORITY &&
      user.role !== Role.ADMIN
    ) {
      throw new ForbiddenException(
        "You are too young to update your birth date. Contact an Administrator to update your birth date.",
      );
    }
    user.birth_date = dto.birth_date;
  }

  /** Soft deletes a user with the specified ID. */
  public async delete(id: number): Promise<GamevaultUser> {
    const user = await this.findOneByUserIdOrFail(id);
    return this.userRepository.softRemove(user);
  }

  /** Recovers a deleted user with the specified ID. */
  public async recover(id: number): Promise<GamevaultUser> {
    const user = await this.findOneByUserIdOrFail(id);
    return this.userRepository.recover(user);
  }

  /** Check if the user with the given username has at least the given role */
  public async checkIfUsernameIsAtLeastRole(username: string, role: Role) {
    try {
      const user = await this.findOneByUsernameOrFail(username);
      return user.role >= role;
    } catch {
      return false;
    }
  }

  public async findUserAgeByUsername(
    username: string,
  ): Promise<number | undefined> {
    if (!configuration.PARENTAL.AGE_RESTRICTION_ENABLED) {
      return undefined;
    }
    const user = await this.findOneByUsernameOrFail(username);
    return this.calculateAge(user.birth_date);
  }

  /** Check if the username matches the user ID or is an administrator */
  public async checkIfUsernameMatchesIdOrIsAdmin(
    userId: number,
    username: string,
  ): Promise<boolean> {
    if (configuration.TESTING.AUTHENTICATION_DISABLED) {
      return true;
    }
    if (!username) {
      throw new UnauthorizedException("No Authorization provided");
    }
    const user = await this.findOneByUserIdOrFail(userId);
    if (user.role === Role.ADMIN) {
      return true;
    }
    if (user.username?.toLowerCase() !== username?.toLowerCase()) {
      throw new ForbiddenException(
        {
          requestedId: userId,
          requestedUser: user.username,
          requestorUser: username,
        },
        "You are not allowed to make changes to other users data.",
      );
    }
    return true;
  }

  /** Bookmarks a game with the specified ID to the given user. */
  public async bookmarkGame(userId: number, gameId: number) {
    const user = await this.findOneByUserIdOrFail(userId, {
      loadDeletedEntities: false,
      loadRelations: ["bookmarked_games"],
    });
    if (user.bookmarked_games.some((game) => game.id === gameId)) {
      return user;
    }

    const game = await this.gamesService.findOneByGameIdOrFail(gameId, {
      loadDeletedEntities: false,
      loadRelations: false,
    });

    await this.userRepository
      .createQueryBuilder()
      .relation(GamevaultUser, "bookmarked_games")
      .of(user)
      .add(game);

    user.bookmarked_games.push(game);

    this.logger.log({
      message: "User bookmarked game.",
      user: user.username,
      game: {
        id: game.id,
        path: game.path,
      },
    });
    return user;
  }

  /** Unbookmarks a game with the specified ID from the given user. */
  public async unbookmarkGame(userId: number, gameId: number) {
    const user = await this.findOneByUserIdOrFail(userId, {
      loadDeletedEntities: false,
      loadRelations: ["bookmarked_games"],
    });
    if (!user.bookmarked_games.some((game) => game.id === gameId)) {
      return user;
    }

    const game = await this.gamesService.findOneByGameIdOrFail(gameId, {
      loadDeletedEntities: false,
      loadRelations: false,
    });

    await this.userRepository
      .createQueryBuilder()
      .relation(GamevaultUser, "bookmarked_games")
      .of(user)
      .remove(game);

    user.bookmarked_games = user.bookmarked_games.filter((bookmark) => {
      return bookmark.id !== game.id;
    });

    this.logger.log({
      message: "User unbookmarked game.",
      user: user.username,
      game: {
        id: game.id,
        path: game.path,
      },
    });

    return user;
  }

  public calculateAge(birthDate: Date) {
    if (!birthDate) {
      return 0;
    }
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Throws an exception if there is already a user with the given username or
   * email.
   */
  private async throwIfAlreadyExists(
    username: string | undefined,
    email: string | undefined,
  ) {
    if (!username && !email) {
      throw new BadRequestException(
        `Can't check if a user exists if neither username nor email is given.`,
      );
    }

    const where = [];
    if (username) {
      where.push({ username: ILike(username) });
    }

    if (email) {
      where.push({ email: ILike(email) });
    }

    const existingUser = await this.userRepository.findOne({ where });

    if (existingUser) {
      const duplicateField =
        existingUser.username?.toLowerCase() === username?.toLowerCase()
          ? "username"
          : "email";
      throw new ForbiddenException(
        `A user with this ${duplicateField} already exists. (case-insensitive)`,
      );
    }
  }

  /** Filters deleted progresses from the user. */
  private filterDeletedProgresses(user: GamevaultUser) {
    if (user.progresses) {
      user.progresses = user.progresses.filter(
        (progress) => !progress.deleted_at,
      );
    }
    return user;
  }
}
