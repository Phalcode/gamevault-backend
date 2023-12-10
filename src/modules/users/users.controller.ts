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
import { IdDto } from "../database/models/id.dto";
import { RegisterUserDto } from "./models/register-user.dto";
import { GamevaultUser } from "./gamevault-user.entity";
import { UsersService } from "./users.service";
import { UpdateUserDto } from "./models/update-user.dto";
import { MinimumRole } from "../pagination/minimum-role.decorator";
import { Role } from "./models/role.enum";
import { Public } from "../../decorators/public.decorator";
import { SocketSecretService } from "./socket-secret.service";

@ApiBasicAuth()
@ApiTags("user")
@Controller("users")
export class UsersController {
  constructor(
    private usersService: UsersService,
    private socketSecretService: SocketSecretService,
  ) {}

  /** Get an overview of all activated and non-deleted users. */
  @Get()
  @ApiOperation({
    summary: "get an overview of all activated and non-deleted users",
    operationId: "getUsers",
  })
  @ApiOkResponse({ type: () => GamevaultUser, isArray: true })
  @MinimumRole(Role.GUEST)
  async getUsers(): Promise<GamevaultUser[]> {
    return await this.usersService.getAll();
  }

  /** Get an overview of all users. */
  @Get("all")
  @MinimumRole(Role.ADMIN)
  @ApiOperation({
    summary: "get an overview of all users",
    operationId: "getUsersAdmin",
  })
  @ApiOkResponse({ type: () => GamevaultUser, isArray: true })
  async getUsersAdmin(): Promise<GamevaultUser[]> {
    return await this.usersService.getAll(true, true);
  }

  /** Retrieve user information based on the provided request object. */
  @Get("me")
  @ApiOperation({
    summary: "get details of your user",
    operationId: "getUserMe",
  })
  @MinimumRole(Role.GUEST)
  @ApiOkResponse({ type: () => GamevaultUser })
  async getUserMe(
    @Request() request: { gamevaultuser: GamevaultUser },
  ): Promise<GamevaultUser> {
    const user = await this.usersService.findByUsernameOrFail(
      request.gamevaultuser.username,
    );
    user.socket_secret = await this.socketSecretService.getSocketSecretOrFail(
      user.id,
    );
    return user;
  }

  /** Updates details of the user. */
  @Put("me")
  @ApiBody({ type: () => UpdateUserDto })
  @ApiOperation({
    summary: "update details of your user",
    operationId: "putUserMe",
  })
  @MinimumRole(Role.USER)
  @ApiOkResponse({ type: () => GamevaultUser })
  async putUserMe(
    @Body() dto: UpdateUserDto,
    @Request() request: { gamevaultuser: GamevaultUser },
  ): Promise<GamevaultUser> {
    const user = await this.usersService.findByUsernameOrFail(
      request.gamevaultuser.username,
    );
    return await this.usersService.update(user.id, dto, false);
  }

  /** Deletes your own user. */
  @Delete("me")
  @ApiOperation({
    summary: "delete your own user",
    operationId: "deleteUserMe",
  })
  @ApiOkResponse({ type: () => GamevaultUser })
  @MinimumRole(Role.USER)
  async deleteUserMe(@Request() request): Promise<GamevaultUser> {
    const user = await this.usersService.findByUsernameOrFail(
      request.gamevaultuser.username,
    );
    return await this.usersService.delete(user.id);
  }

  /** Get details on a user. */
  @Get(":id")
  @ApiOperation({
    summary: "get details on a user",
    operationId: "getUserByUserId",
  })
  @MinimumRole(Role.GUEST)
  @ApiOkResponse({ type: () => GamevaultUser })
  async getUserByUserId(@Param() params: IdDto): Promise<GamevaultUser> {
    return await this.usersService.findByUserIdOrFail(Number(params.id));
  }

  /** Updates details of any user. */
  @Put(":id")
  @ApiBody({ type: () => UpdateUserDto })
  @ApiOperation({
    summary: "update details of any user",
    operationId: "putUserByUserId",
  })
  @MinimumRole(Role.ADMIN)
  @ApiOkResponse({ type: () => GamevaultUser })
  async putUserByUserId(
    @Param() params: IdDto,
    @Body() dto: UpdateUserDto,
  ): Promise<GamevaultUser> {
    return await this.usersService.update(Number(params.id), dto, true);
  }

  /** Deletes any user with the specified ID. */
  @Delete(":id")
  @ApiOperation({
    summary: "delete any user",
    operationId: "deleteUserByUserId",
  })
  @ApiOkResponse({ type: () => GamevaultUser })
  @MinimumRole(Role.ADMIN)
  async deleteUserByUserId(@Param() params: IdDto): Promise<GamevaultUser> {
    return await this.usersService.delete(Number(params.id));
  }

  /** Recover a deleted user. */
  @Post(":id/recover")
  @MinimumRole(Role.ADMIN)
  @ApiOperation({
    summary: "recover a deleted user",
    operationId: "postUserRecoverByUserId",
  })
  @ApiOkResponse({ type: () => GamevaultUser })
  async postUserRecoverByUserId(
    @Param() params: IdDto,
  ): Promise<GamevaultUser> {
    return await this.usersService.recover(Number(params.id));
  }

  /** Register a new user. */
  @Post("register")
  @ApiOperation({
    summary: "register a new user",
    description:
      "The user may has to be activated afterwards. This endpoint only works if registration is enabled",
    operationId: "postUserRegister",
  })
  @ApiOkResponse({ type: () => GamevaultUser })
  @ApiBody({ type: () => RegisterUserDto })
  @Public()
  async postUserRegister(@Body() dto: RegisterUserDto): Promise<GamevaultUser> {
    if (configuration.SERVER.REGISTRATION_DISABLED) {
      throw new MethodNotAllowedException(
        "Registration is disabled on this server.",
      );
    }
    return await this.usersService.register(dto);
  }
}
