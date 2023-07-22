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
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import configuration from "../configuration";
import { IdDto } from "../dtos/id.dto";
import { RegisterUserDto } from "../dtos/register-user.dto";
import { GamevaultUser } from "../database/entities/gamevault-user.entity";
import { UsersService } from "../services/users.service";
import { UpdateUserDto } from "../dtos/update-user.dto";
import { MinimumRole } from "../decorators/minimum-role.decorator";
import { Role } from "../models/role.enum";
import { Public } from "../decorators/public.decorator";

@ApiTags("user")
@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) {}

  /**
   * Get an overview of all activated and non-deleted users.
   *
   * @returns List of all activated and non-deleted users
   */
  @Get()
  @ApiOperation({
    summary: "get an overview of all activated and non-deleted users",
    operationId: "getUsers",
  })
  @ApiOkResponse({ type: () => GamevaultUser, isArray: true })
  @MinimumRole(Role.GUEST)
  async getUsers(): Promise<GamevaultUser[]> {
    return await this.usersService.getUsers();
  }

  /**
   * Get an overview of all users.
   *
   * @returns List of all users
   */
  @Get("all")
  @MinimumRole(Role.ADMIN)
  @ApiOperation({
    summary: "get an overview of all users",
    operationId: "getAllUsers",
  })
  @ApiOkResponse({ type: () => GamevaultUser, isArray: true })
  async getAllUsers(): Promise<GamevaultUser[]> {
    return await this.usersService.getUsers(true, true);
  }

  /**
   * Retrieve user information based on the provided request object.
   *
   * @async
   * @param request - The request object.
   * @returns - The user object matching the provided username.
   * @throws {Error} If no user is found with the provided username.
   */
  @Get("me")
  @ApiOperation({
    summary: "get details of your user",
    operationId: "getMe",
  })
  @MinimumRole(Role.GUEST)
  @ApiOkResponse({ type: () => GamevaultUser })
  async getMe(
    @Request() request: { gamevaultuser: GamevaultUser },
  ): Promise<GamevaultUser> {
    return await this.usersService.getUserByUsernameOrFail(
      request.gamevaultuser.username,
    );
  }

  /**
   * Updates details of the user.
   *
   * @param dto - The updated user data.
   * @param request - The request object.
   * @returns The updated user.
   * @route PUT /me
   * @summary Update details of your user
   */
  @Put("me")
  @ApiBody({ type: () => UpdateUserDto })
  @ApiOperation({
    summary: "update details of your user",
    operationId: "updateMe",
  })
  @MinimumRole(Role.USER)
  @ApiOkResponse({ type: () => GamevaultUser })
  async updateMe(
    @Body() dto: UpdateUserDto,
    @Request() request,
  ): Promise<GamevaultUser> {
    const user = await this.usersService.getUserByUsernameOrFail(
      request.gamevaultuser.username,
    );
    return await this.usersService.update(user.id, dto, false);
  }

  /**
   * Deletes your own user.
   *
   * @param request - The request object.
   * @returns The deleted user.
   */
  @Delete("me")
  @ApiOperation({ summary: "delete your own user", operationId: "deleteMe" })
  @ApiOkResponse({ type: () => GamevaultUser })
  @MinimumRole(Role.USER)
  async deleteMe(@Request() request): Promise<GamevaultUser> {
    const user = await this.usersService.getUserByUsernameOrFail(
      request.gamevaultuser.username,
    );
    return await this.usersService.delete(user.id);
  }

  /**
   * Get details on a user.
   *
   * @param params - The parameters for the request.
   * @returns - A Promise that resolves to the GamevaultUser object.
   * @throws {NotFoundException} - If the user with the specified ID does not
   *   exist.
   */
  @Get(":id")
  @ApiOperation({
    summary: "get details on a user",
    operationId: "getUserById",
  })
  @MinimumRole(Role.GUEST)
  @ApiOkResponse({ type: () => GamevaultUser })
  async getUserById(@Param() params: IdDto): Promise<GamevaultUser> {
    return await this.usersService.getUserByIdOrFail(Number(params.id));
  }

  /**
   * Updates details of any user.
   *
   * @param params - The user ID.
   * @param dto - The updated user data.
   * @returns The updated user.
   */
  @Put(":id")
  @ApiBody({ type: () => UpdateUserDto })
  @ApiOperation({
    summary: "update details of any user",
    operationId: "updateAnyUser",
  })
  @MinimumRole(Role.ADMIN)
  @ApiOkResponse({ type: () => GamevaultUser })
  async updateAnyUser(
    @Param() params: IdDto,
    @Body() dto: UpdateUserDto,
  ): Promise<GamevaultUser> {
    return await this.usersService.update(Number(params.id), dto, true);
  }

  /**
   * Deletes any user with the specified ID.
   *
   * @param params - The ID of the user to delete.
   * @returns The deleted user.
   */
  @Delete(":id")
  @ApiOperation({ summary: "delete any user", operationId: "deleteAnyUser" })
  @ApiOkResponse({ type: () => GamevaultUser })
  @MinimumRole(Role.ADMIN)
  async deleteAnyUser(@Param() params: IdDto): Promise<GamevaultUser> {
    return await this.usersService.delete(Number(params.id));
  }

  /**
   * Recover a deleted user.
   *
   * @param params - The ID of the user to recover.
   * @returns The recovered user.
   */
  @Post(":id/recover")
  @MinimumRole(Role.ADMIN)
  @ApiOperation({
    summary: "recover a deleted user",
    operationId: "recoverUser",
  })
  @ApiOkResponse({ type: () => GamevaultUser })
  async recoverUser(@Param() params: IdDto): Promise<GamevaultUser> {
    return await this.usersService.recover(Number(params.id));
  }

  /**
   * Register a new user.
   *
   * @async
   * @param dto - The data of the user being registered
   * @returns The registered user data
   * @throws {MethodNotAllowedException} Registration is disabled
   */
  @Post("register")
  @ApiOperation({
    summary: "register a new user",
    description:
      "The user may has to be activated afterwards. This endpoint only works if registration is enabled",
    operationId: "register",
  })
  @ApiOkResponse({ type: () => GamevaultUser })
  @ApiBody({ type: () => RegisterUserDto })
  @Public()
  async register(@Body() dto: RegisterUserDto): Promise<GamevaultUser> {
    if (configuration.SERVER.REGISTRATION_DISABLED) {
      throw new MethodNotAllowedException(
        "Registration is disabled on this server.",
      );
    }
    return await this.usersService.register(dto);
  }
}
