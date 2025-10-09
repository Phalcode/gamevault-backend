import {
  Controller,
  Get,
  HttpStatus,
  Logger,
  Request,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiOAuth2,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Response } from "express";
import configuration from "../../../configuration";
import { SkipGuards } from "../../../decorators/skip-guards.decorator";
import { GamevaultUser } from "../../users/gamevault-user.entity";
import { AuthenticationService } from "../authentication.service";
import { Oauth2Guard } from "../guards/oauth2.guard";
import { TokenPairDto } from "../models/token-pair.dto";

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
  @ApiOkResponse({ type: () => TokenPairDto })
  @ApiResponse({
    status: HttpStatus.NOT_ACCEPTABLE,
    description:
      "User is not activated. Contact an Administrator to activate the User.",
  })
  async getAuthOauth2Login(
    @Request()
    request: {
      user: GamevaultUser;
      ip: string;
      headers: { [key: string]: string };
    },
    @Res() res: Response, // Inject Express Response object to customize response
  ) {
    this.logger.log({
      message: "User logged in via oauth2.",
      user: request.user,
    });

    // Get token data
    const tokenData = await this.authenticationService.login(
      request.user,
      request.ip,
      request.headers["user-agent"] || "unknown",
    );

    // Serialize token data as JSON string safely for embedding
    const jsonData = JSON.stringify(tokenData);

    // HTML page that sends token data back to opener via postMessage and optionally closes the popup
    const htmlResponse = `
      <!DOCTYPE html>
      <html lang="en">
      <head><title>Authentication Result</title></head>
      <body>
        <script>
          (function() {
            try {
              const data = ${jsonData};
              // Send data to the opener window
              window.opener.postMessage({ type: 'auth-success', data: data }, window.origin);
              // Optionally close the popup after sending data
              window.close();
            } catch (error) {
              document.body.innerText = 'Authentication failed: ' + error;
            }
          })();
        </script>
        <noscript>Your browser does not support JavaScript!</noscript>
      </body>
      </html>
    `;

    res.status(HttpStatus.OK).contentType("text/html").send(htmlResponse);
  }
}
