import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  MethodNotAllowedException,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBasicAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import configuration from "../../../configuration";
import { ConditionalRegistration } from "../../../decorators/conditional-registration.decorator";
import { DisableApiIf } from "../../../decorators/disable-api-if.decorator";
import { SkipGuards } from "../../../decorators/skip-guards.decorator";
import { GamevaultUser } from "../../users/gamevault-user.entity";
import { RegisterUserDto } from "../../users/models/register-user.dto";
import { Role } from "../../users/models/role.enum";
import { AuthenticationService } from "../authentication.service";
import { BasicAuthGuard } from "../guards/basic-auth.guard";
import { TokenPairDto } from "../models/token-pair.dto";

@Controller("auth/basic")
@ApiTags("auth")
@UseGuards(BasicAuthGuard)
@ApiBasicAuth()
export class BasicAuthController {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly authenticationService: AuthenticationService) {}
  @Get("login")
  @SkipGuards()
  @ApiOperation({
    summary: "Performs a basic auth login using the provided user credentials",
    description:
      "Initiates a login process by validating the user and issuing a bearer token.",
    operationId: "getAuthBasicLogin",
  })
  @ApiOkResponse({ type: () => TokenPairDto })
  @ApiResponse({
    status: HttpStatus.NOT_ACCEPTABLE,
    description:
      "User is not activated. Contact an Administrator to activate the User.",
  })
  async getAuthBasicLogin(
    @Request()
    request: {
      user: GamevaultUser;
      ip: string;
      headers: { [key: string]: string };
    },
  ) {
    this.logger.log({
      message: "User logged in via basic auth.",
      user: request.user,
    });
    return this.authenticationService.login(
      request.user,
      request.ip,
      request.headers["user-agent"] || "unknown",
    );
  }

  /** Register a new user. */
  @Post("register")
  @ApiOperation({
    summary: "register a new user",
    description:
      "The user may has to be activated afterwards to be active. This endpoint only works if registration is enabled",
    operationId: "postAuthBasicRegister",
  })
  @ApiOkResponse({ type: () => GamevaultUser })
  @ApiBody({ type: () => RegisterUserDto })
  @DisableApiIf(configuration.SERVER.DEMO_MODE_ENABLED)
  @ConditionalRegistration
  async postAuthBasicRegister(
    @Body() dto: RegisterUserDto,
    @Request() req: { user: GamevaultUser },
  ): Promise<GamevaultUser> {
    if (
      configuration.SERVER.REGISTRATION_DISABLED &&
      (req.user?.role ?? 0) < Role.ADMIN
    ) {
      throw new MethodNotAllowedException(
        "Self-Registration is disabled on this server. Contact an Administrator to register a new user.",
      );
    }
    return this.authenticationService.register(dto);
  }
}
