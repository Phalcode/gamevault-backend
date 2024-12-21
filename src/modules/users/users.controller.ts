import {
  Body,
  Controller,
  Delete,
  Get,
  MethodNotAllowedException,
  Param,
  Post,
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

import configuration from "../../configuration";
import { ConditionalRegistration } from "../../decorators/conditional-registration.decorator";
import { DisableApiIf } from "../../decorators/disable-api-if.decorator";
import { MinimumRole } from "../../decorators/minimum-role.decorator";
import { GameIdDto } from "../games/models/game-id.dto";
import { GamevaultUser } from "./gamevault-user.entity";
import { RegisterUserDto } from "./models/register-user.dto";
import { Role } from "./models/role.enum";
import { UpdateUserDto } from "./models/update-user.dto";
import { UserIdDto } from "./models/user-id.dto";
import { SocketSecretService } from "./socket-secret.service";
import { UsersService } from "./users.service";

@ApiBasicAuth()
@ApiTags("user")
@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly socketSecretService: SocketSecretService,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      "get an overview of all users. admins can see hidden users using this endpoint aswell.",
    operationId: "getUsers",
  })
  @ApiOkResponse({ type: () => GamevaultUser, isArray: true })
  @MinimumRole(Role.GUEST)
  async getUsers(
    @Request() req: { gamevaultuser: GamevaultUser },
  ): Promise<GamevaultUser[]> {
    const includeHidden = req.gamevaultuser.role >= Role.ADMIN;
    return this.usersService.find(includeHidden);
  }

  /** Retrieve user information based on the provided request object. */
  @Get("me")
  @ApiOperation({
    summary: "get details of your user",
    operationId: "getUsersMe",
  })
  @MinimumRole(Role.GUEST)
  @ApiOkResponse({ type: () => GamevaultUser })
  async getUsersMe(
    @Request() request: { gamevaultuser: GamevaultUser },
  ): Promise<GamevaultUser> {
    const user = await this.usersService.findOneByUsernameOrFail(
      request.gamevaultuser.username,
    );
    user.socket_secret = await this.socketSecretService.findSocketSecretOrFail(
      user.id,
    );
    return user;
  }

  /** Updates details of the user. */
  @Put("me")
  @ApiBody({ type: () => UpdateUserDto })
  @ApiOperation({
    summary: "update details of your user",
    operationId: "putUsersMe",
  })
  @MinimumRole(Role.USER)
  @ApiOkResponse({ type: () => GamevaultUser })
  @DisableApiIf(configuration.SERVER.DEMO_MODE_ENABLED)
  async putUsersMe(
    @Body() dto: UpdateUserDto,
    @Request() request: { gamevaultuser: GamevaultUser },
  ): Promise<GamevaultUser> {
    const user = await this.usersService.findOneByUsernameOrFail(
      request.gamevaultuser.username,
    );
    return this.usersService.update(user.id, dto, false);
  }

  /** Deletes your own user. */
  @Delete("me")
  @ApiOperation({
    summary: "delete your own user",
    operationId: "deleteUserMe",
  })
  @ApiOkResponse({ type: () => GamevaultUser })
  @MinimumRole(Role.USER)
  @DisableApiIf(configuration.SERVER.DEMO_MODE_ENABLED)
  async deleteUsersMe(@Request() request): Promise<GamevaultUser> {
    const user = await this.usersService.findOneByUsernameOrFail(
      request.gamevaultuser.username,
    );
    return this.usersService.delete(user.id);
  }

  @Post("me/bookmark/:game_id")
  @ApiOperation({
    summary: "bookmark a game",
    operationId: "postUsersMeBookmark",
  })
  @MinimumRole(Role.GUEST)
  async postUsersMeBookmark(
    @Request() request: { gamevaultuser: GamevaultUser },
    @Param() params: GameIdDto,
  ): Promise<GamevaultUser> {
    const user = await this.usersService.findOneByUsernameOrFail(
      request.gamevaultuser.username,
      { loadDeletedEntities: false, loadRelations: ["bookmarked_games"] },
    );
    return this.usersService.bookmarkGame(user.id, Number(params.game_id));
  }

  @Delete("me/bookmark/:game_id")
  @ApiOperation({
    summary: "unbookmark a game",
    operationId: "deleteUsersMeBookmark",
  })
  @MinimumRole(Role.GUEST)
  async deleteUsersMeBookmark(
    @Request() request: { gamevaultuser: GamevaultUser },
    @Param() params: GameIdDto,
  ): Promise<GamevaultUser> {
    const user = await this.usersService.findOneByUsernameOrFail(
      request.gamevaultuser.username,
      { loadDeletedEntities: false, loadRelations: ["bookmarked_games"] },
    );
    return this.usersService.unbookmarkGame(user.id, Number(params.game_id));
  }

  /** Get details on a user. */
  @Get(":user_id")
  @ApiOperation({
    summary: "get details on a user",
    operationId: "getUserByUserId",
  })
  @MinimumRole(Role.GUEST)
  @ApiOkResponse({ type: () => GamevaultUser })
  async getUserByUserId(@Param() params: UserIdDto): Promise<GamevaultUser> {
    return this.usersService.findOneByUserIdOrFail(Number(params.user_id));
  }

  /** Updates details of any user. */
  @Put(":user_id")
  @ApiBody({ type: () => UpdateUserDto })
  @ApiOperation({
    summary: "update details of any user",
    operationId: "putUserByUserId",
  })
  @MinimumRole(Role.ADMIN)
  @ApiOkResponse({ type: () => GamevaultUser })
  async putUserByUserId(
    @Param() params: UserIdDto,
    @Body() dto: UpdateUserDto,
  ): Promise<GamevaultUser> {
    return this.usersService.update(Number(params.user_id), dto, true);
  }

  /** Deletes any user with the specified ID. */
  @Delete(":user_id")
  @ApiOperation({
    summary: "delete any user",
    operationId: "deleteUserByUserId",
  })
  @ApiOkResponse({ type: () => GamevaultUser })
  @MinimumRole(Role.ADMIN)
  async deleteUserByUserId(@Param() params: UserIdDto): Promise<GamevaultUser> {
    return this.usersService.delete(Number(params.user_id));
  }

  /** Recover a deleted user. */
  @Post(":user_id/recover")
  @MinimumRole(Role.ADMIN)
  @ApiOperation({
    summary: "recover a deleted user",
    operationId: "postUserRecoverByUserId",
  })
  @ApiOkResponse({ type: () => GamevaultUser })
  async postUserRecoverByUserId(
    @Param() params: UserIdDto,
  ): Promise<GamevaultUser> {
    return this.usersService.recover(Number(params.user_id));
  }

  /** Register a new user. */
  @Post("register")
  @ApiOperation({
    summary: "register a new user",
    description:
      "The user may may has to be activated afterwards to be active. This endpoint only works if registration is enabled",
    operationId: "postUserRegister",
  })
  @ApiOkResponse({ type: () => GamevaultUser })
  @ApiBody({ type: () => RegisterUserDto })
  @DisableApiIf(configuration.SERVER.DEMO_MODE_ENABLED)
  @ConditionalRegistration
  async postUserRegister(
    @Body() dto: RegisterUserDto,
    @Request() req: { gamevaultuser: GamevaultUser },
  ): Promise<GamevaultUser> {
    if (
      configuration.SERVER.REGISTRATION_DISABLED &&
      (req.gamevaultuser?.role ?? 0) < Role.ADMIN
    ) {
      throw new MethodNotAllowedException(
        "Registration is disabled on this server.",
      );
    }
    return this.usersService.register(dto);
  }
}
