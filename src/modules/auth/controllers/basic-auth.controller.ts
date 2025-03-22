import {
  Body,
  Controller,
  Get,
  MethodNotAllowedException,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import configuration from "../../../configuration";
import { ConditionalRegistrationAccessibility } from "../../../decorators/conditional-public-registration.decorator";
import { DisableApiIf } from "../../../decorators/disable-api-if.decorator";
import { DisableAuthenticationGuard } from "../../../decorators/disable-authentication-guard";
import { GamevaultUser } from "../../users/gamevault-user.entity";
import { RegisterUserDto } from "../../users/models/register-user.dto";
import { Role } from "../../users/models/role.enum";
import { AuthenticationService } from "../authentication.service";
import { BasicAuthGuard } from "../guards/basic-auth.guard";

@Controller("auth/basic")
@ApiTags("auth")
@UseGuards(BasicAuthGuard)
export class BasicAuthController {
  constructor(private readonly authenticationService: AuthenticationService) {}
  @Get("login")
  @DisableAuthenticationGuard()
  /* TODO: API DESC
  @ApiOkResponse({ type: () => Health })
  @ApiOperation({
    summary: "returns the news.md file from the config directory.",
    operationId: "getNews",
  })*/
  async login(@Request() request: { user: GamevaultUser }) {
    return this.authenticationService.login(request.user);
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
  @ConditionalRegistrationAccessibility
  async postUserRegister(
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
