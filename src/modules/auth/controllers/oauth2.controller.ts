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
<head><title>GameVault Authentication Result</title></head>
<body>
  <p id="jsonData" style="color: transparent; user-select: text;">${jsonData}</p>

  <script>
    setTimeout(() => {
      console.log("Starting token processing...");

      const tokenData = ${JSON.stringify(jsonData)};
      console.log("Raw tokenData:", tokenData);

      if (tokenData.access_token) {
        console.log("Access token found. Preparing to redirect.");

        const origin = window.location.origin;
        const targetUrl = origin + "?access_token=" + encodeURIComponent(tokenData.access_token) + "&refresh_token=" + encodeURIComponent(tokenData.refresh_token);
        console.log("Redirecting to:", targetUrl);

        window.location.href = targetUrl;
      } else {
        console.warn("Access token not found in tokenData.");
      }
    }, 100);
  </script>
</body>
</html>
`;

    res.status(HttpStatus.OK).contentType("text/html").send(htmlResponse);
  }
}
