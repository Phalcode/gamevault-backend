import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotAcceptableException,
  NotFoundException,
  OnApplicationBootstrap,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { hash } from "bcrypt";
import { randomBytes } from "crypto";
import lodash from "lodash";
import {
  EntityNotFoundError,
  type FindManyOptions,
  type FindOptionsWhere,
  ILike,
  IsNull,
  Not,
  Repository,
} from "typeorm";
import type { AppConfiguration } from "../../configuration.js";
import { InjectGamevaultConfig } from "../../decorators/inject-gamevault-config.decorator.js";
import {
  type FindOptions,
  toFindOptionsRelations,
  toFindOptionsSelect,
} from "../../globals.js";
import { logGamevaultGame } from "../../logging.js";
import { GamesService } from "../games/games.service.js";
import { MediaService } from "../media/media.service.js";
import { GamevaultUser } from "./gamevault-user.entity.js";
import { type RegisterUserDto } from "./models/register-user.dto.js";
import { Role } from "./models/role.enum.js";
import { type UpdateUserDto } from "./models/update-user.dto.js";

const { toLower } = lodash;

@Injectable()
export class UsersService implements OnApplicationBootstrap {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    @InjectRepository(GamevaultUser)
    private readonly userRepository: Repository<GamevaultUser>,
    @Inject(forwardRef(() => MediaService))
    // Cyclic service reference (ESM): intentionally loosely typed to avoid design:paramtypes TDZ
    private readonly mediaService: any,
    @Inject(forwardRef(() => GamesService))
    private readonly gamesService: GamesService,
    @InjectGamevaultConfig() private readonly config: AppConfiguration,
  ) {}

  async onApplicationBootstrap() {
    this.recoverAdmin();
  }

  private async recoverAdmin() {
    try {
      if (!this.config.SERVER.ADMIN_USERNAME) {
        return;
      }

      const user = await this.findOneByUsernameOrFail(
        this.config.SERVER.ADMIN_USERNAME,
      );

      await this.update(
        user.id,
        {
          role: Role.ADMIN,
          activated: true,
          password: this.config.SERVER.ADMIN_PASSWORD || undefined,
        },
        true,
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn({
          message: `The admin user wasn't recovered.`,
          reason: `The admin user "${this.config.SERVER.ADMIN_USERNAME}" could not be found in the database. Make sure to register the user first.`,
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
    let relationPaths: string[] = [];

    if (options.loadRelations) {
      if (options.loadRelations === true) {
        relationPaths = [
          "progresses",
          "progresses.game",
          "progresses.game.metadata",
          "progresses.game.metadata.cover",
          "bookmarked_games",
        ];
      } else if (Array.isArray(options.loadRelations))
        relationPaths = options.loadRelations;
    }

    const relations =
      relationPaths.length > 0
        ? toFindOptionsRelations<GamevaultUser>(relationPaths)
        : undefined;

    const where = options.loadDeletedEntities
      ? { id }
      : { id, deleted_at: IsNull() };

    const user = await this.userRepository
      .findOneOrFail({
        where,
        relations,
        withDeleted: true,
        relationLoadStrategy: "query",
      })
      .catch((error) => {
        throw new NotFoundException(`User with id ${id} was not found.`, {
          cause: error,
        });
      });
    return this.filterDeletedContent(user);
  }

  /** Get user by username or throw an exception if not found */
  public async findOneByUsernameOrFail(
    username: string,
    options: FindOptions = { loadRelations: true, loadDeletedEntities: true },
  ): Promise<GamevaultUser> {
    let relationPaths: string[] = [];

    if (options.loadRelations) {
      if (options.loadRelations === true) {
        relationPaths = ["progresses", "progresses.game", "bookmarked_games"];
      } else if (Array.isArray(options.loadRelations))
        relationPaths = options.loadRelations;
    }

    const relations =
      relationPaths.length > 0
        ? toFindOptionsRelations<GamevaultUser>(relationPaths)
        : undefined;

    const where = options.loadDeletedEntities
      ? { username: ILike(username) }
      : { username: ILike(username), deleted_at: IsNull() };

    const user = await this.userRepository
      .findOneOrFail({
        where,
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
    return this.filterDeletedContent(user);
  }

  public async find(
    includeHiddenAndDeleted: boolean = false,
  ): Promise<GamevaultUser[]> {
    const query: FindManyOptions<GamevaultUser> = {
      order: { id: "ASC" },
      withDeleted: includeHiddenAndDeleted,
      relationLoadStrategy: "query",
      where: includeHiddenAndDeleted
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
      dto.username === this.config.SERVER.ADMIN_USERNAME || isFirstUser;
    const isActivated =
      this.config.SERVER.ACCOUNT_ACTIVATION_DISABLED || isAdministrator;

    const user = new GamevaultUser();
    user.username = dto.username;
    user.password = await hash(dto.password, 10);
    user.api_key = randomBytes(32).toString("hex");
    user.first_name = dto.first_name || undefined;
    user.last_name = dto.last_name || undefined;
    user.email = dto.email || undefined;
    user.birth_date = dto.birth_date ? new Date(dto.birth_date) : undefined;
    user.activated = isActivated;
    user.role = isAdministrator ? Role.ADMIN : Role.USER;

    const registeredUser = await this.userRepository.save(user);
    registeredUser.password = "**REDACTED**";
    registeredUser.api_key = "**REDACTED**";
    this.logger.log({
      message: `User has been registered.`,
      user: registeredUser,
    });
    return registeredUser;
  }

  /** Logs in a user with the provided username and password. */
  public async findUserForAuthOrFail(searchBy: {
    id?: number;
    username?: string;
    email?: string;
    idp_id?: string; // TODO: Could Implement search for idp_id
  }): Promise<GamevaultUser> {
    const where: FindOptionsWhere<GamevaultUser>[] = [];

    if (searchBy.id != null) {
      where.push({ id: searchBy.id });
    }
    if (searchBy.username != null) {
      where.push({ username: ILike(searchBy.username) });
    }
    if (searchBy.email != null) {
      where.push({ email: ILike(searchBy.email) });
    }

    if (where.length === 0) {
      throw new BadRequestException(
        "Authentication Failed: No user search criteria were provided.",
      );
    }

    const user = await this.userRepository
      .findOneOrFail({
        where,
        select: toFindOptionsSelect<GamevaultUser>([
          "username",
          "email",
          "password",
          "api_key",
          "activated",
          "role",
          "deleted_at",
        ]),
        withDeleted: true,
        loadEagerRelations: false,
      })
      .catch((error) => {
        if (error instanceof EntityNotFoundError) {
          throw new UnauthorizedException(
            `Authentication Failed: User not found. If you are a new user, please register first.`,
          );
        }
        throw new UnauthorizedException(
          "Authentication Failed: Contact an Administrator to check the server logs for more information.",
          {
            cause: error,
          },
        );
      });
    if (user.deleted_at) {
      throw new UnauthorizedException(
        "Authentication Failed: User has been deleted. Contact an Administrator to recover the User.",
      );
    }
    if (!user.activated && user.role !== Role.ADMIN) {
      throw new NotAcceptableException(
        "Authorization Failed: User is not activated. Contact an Administrator to activate the User.",
      );
    }
    return user;
  }

  public cleanConfidentialUser(user: GamevaultUser): GamevaultUser {
    delete (user as Partial<GamevaultUser>).password;
    delete user.api_key;
    return user;
  }

  /** Updates an existing user with the specified ID. */
  public async update(
    id: number,
    dto: UpdateUserDto,
    isAdmin = false,
  ): Promise<GamevaultUser> {
    const user = await this.findOneByUserIdOrFail(id, { loadRelations: false });
    const logUpdate = (
      property: string,
      from: string | undefined,
      to: string | undefined,
    ) => {
      this.logger.log({
        message: "Updating user property",
        user: user.username,
        property,
        from,
        to,
      });
    };

    if (isAdmin && dto.role != null) {
      logUpdate("role", user.role.toString(), dto.role.toString());
      user.role = dto.role;
    }

    if (isAdmin && dto.activated != null) {
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
      logUpdate("birth_date", user.birth_date?.toISOString(), dto.birth_date);
      await this.updateBirthDate(dto, user, isAdmin);
    }

    if (dto.password != null) {
      logUpdate("password", user.password, "**REDACTED**");
      user.password = await hash(dto.password, 10);
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

    return this.userRepository.save(user);
  }

  private async updateUsername(
    dto: UpdateUserDto,
    user: GamevaultUser,
  ): Promise<void> {
    const username = dto.username;
    if (username == null) {
      return;
    }
    if (toLower(username) !== toLower(user.username)) {
      await this.throwIfAlreadyExists(username, undefined);
    }
    user.username = username;
  }

  private async updateEmail(
    dto: UpdateUserDto,
    user: GamevaultUser,
  ): Promise<void> {
    const email = dto.email;
    if (email == null) {
      return;
    }
    if (toLower(email) !== toLower(user.email)) {
      await this.throwIfAlreadyExists(undefined, email);
    }
    user.email = email;
  }

  private async updateBirthDate(
    dto: UpdateUserDto,
    user: GamevaultUser,
    isAdmin: boolean,
  ): Promise<void> {
    if (
      user.birth_date &&
      this.config.PARENTAL.AGE_RESTRICTION_ENABLED &&
      this.calculateAge(user.birth_date) <
        (this.config.PARENTAL.AGE_OF_MAJORITY ?? 18) &&
      user.role !== Role.ADMIN &&
      !isAdmin
    ) {
      throw new ForbiddenException(
        "You are too young to update your birth date. Contact an Administrator to update your birth date.",
      );
    }
    user.birth_date = dto.birth_date ? new Date(dto.birth_date) : undefined;
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
    if (
      !this.config.PARENTAL.AGE_RESTRICTION_ENABLED ||
      (await this.checkIfUsernameIsAtLeastRole(username, Role.ADMIN))
    ) {
      return undefined;
    }
    const user = await this.findOneByUsernameOrFail(username, {
      loadDeletedEntities: false,
      loadRelations: false,
    });
    return user.birth_date ? this.calculateAge(user.birth_date) : 0;
  }

  /** Check if the username matches the user ID or is an administrator */
  public async checkIfUsernameMatchesIdOrIsAdminOrThrow(
    userId: number,
    username: string,
  ): Promise<boolean> {
    if (this.config.TESTING.AUTHENTICATION_DISABLED) {
      return true;
    }
    if (!username) {
      throw new UnauthorizedException("No Authorization provided");
    }
    // Administrators may modify any user's data.
    if (await this.checkIfUsernameIsAtLeastRole(username, Role.ADMIN)) {
      return true;
    }
    const user = await this.findOneByUserIdOrFail(userId);
    if (toLower(user.username) !== toLower(username)) {
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
    if ((user.bookmarked_games ?? []).some((game) => game.id === gameId)) {
      return user;
    }

    const game = await this.gamesService.findOneByGameIdOrFail(gameId, {
      loadDeletedEntities: false,
    });

    await this.userRepository
      .createQueryBuilder()
      .relation(GamevaultUser, "bookmarked_games")
      .of(user)
      .add(game);

    user.bookmarked_games ??= [];
    user.bookmarked_games.push(game);

    this.logger.log({
      message: "User bookmarked game.",
      user: user.username,
      game: logGamevaultGame(game),
    });
    return user;
  }

  /** Unbookmarks a game with the specified ID from the given user. */
  public async unbookmarkGame(userId: number, gameId: number) {
    const user = await this.findOneByUserIdOrFail(userId, {
      loadDeletedEntities: false,
      loadRelations: ["bookmarked_games"],
    });
    if (!(user.bookmarked_games ?? []).some((game) => game.id === gameId)) {
      return user;
    }

    const game = await this.gamesService.findOneByGameIdOrFail(gameId, {
      loadDeletedEntities: true,
    });

    await this.userRepository
      .createQueryBuilder()
      .relation(GamevaultUser, "bookmarked_games")
      .of(user)
      .remove(game);

    user.bookmarked_games = (user.bookmarked_games ?? []).filter((bookmark) => {
      return bookmark.id !== game.id;
    });

    this.logger.log({
      message: "User unbookmarked game.",
      user: user.username,
      game: logGamevaultGame(game),
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

    const existingUser = await this.userRepository.findOne({
      where,
      relationLoadStrategy: "query",
      withDeleted: true,
    });

    if (existingUser) {
      const duplicateField =
        toLower(existingUser.username) === toLower(username)
          ? "username"
          : "email";
      throw new ForbiddenException(
        `A user with this ${duplicateField} already exists. Please note, that they are case-insensitive.`,
      );
    }
  }

  /** Filters deleted progresses and deleted bookmarked games from the user. */
  private filterDeletedContent(user: GamevaultUser) {
    if (user.progresses) {
      user.progresses = user.progresses.filter(
        (progress) => !progress.deleted_at,
      );
    }
    if (user.bookmarked_games) {
      user.bookmarked_games = user.bookmarked_games.filter(
        (game) => !game.deleted_at,
      );
    }
    return user;
  }
}
