import { Controller, Get, Logger, Request, UseGuards } from "@nestjs/common";
import { ApiOAuth2, ApiOperation, ApiTags } from "@nestjs/swagger";
import configuration from "../../../configuration";
import { SkipGuards } from "../../../decorators/skip-guards.decorator";
import { GamevaultUser } from "../../users/gamevault-user.entity";
import { AuthenticationService } from "../authentication.service";
import { Oauth2Guard } from "../guards/oauth2.guard";

@Controller("auth/oauth2")
@ApiTags("auth")
@UseGuards(Oauth2Guard)
@ApiOAuth2(configuration.AUTH.OAUTH2.SCOPES)
export class OAuth2Controller {
  private readonly logger = new Logger(this.constructor.name);
  constructor(private readonly authenticationService: AuthenticationService) {}
  @Get("login")
  @SkipGuards()
  @ApiOperation({
    summary: "Performs an oauth2 login using the configured identity provider.",
    description:
      "Initiates a login process by redirecting to the identity provider for validating the user and issuing a bearer token.",
    operationId: "getAuthOauth2Login",
  })
  async getAuthOauth2Login(
    @Request()
    request: {
      user: GamevaultUser;
      ip: string;
      headers: { [key: string]: string };
    },
  ) {
    this.logger.log({
      message: "User logged in via oauth2.",
      user: request.user,
    });
    return this.authenticationService.login(
      request.user,
      request.ip,
      request.headers["user-agent"] || "unknown",
    );
  }
}
