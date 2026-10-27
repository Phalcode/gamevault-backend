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
import { type Response } from "express";
import configuration from "../../../configuration.js";
import { SkipGuards } from "../../../decorators/skip-guards.decorator.js";
import { GamevaultUser } from "../../users/gamevault-user.entity.js";
import { AuthenticationService } from "../authentication.service.js";
import { Oauth2Guard } from "../guards/oauth2.guard.js";
import { TokenPairDto } from "../models/token-pair.dto.js";
import { resolveOAuthReturnOrigin } from "../oauth-return-origin.js";

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
      session?: { oauth2ReturnOrigin?: string };
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

    // The origin the client asked for tokens to be returned to. Set by the
    // Oauth2Guard from the validated `client_origin` query parameter before the
    // redirect to the identity provider. `null` means either nothing was
    // requested or the requested origin is not trusted, in which case we fall
    // back to the server's own origin (the historical behaviour).
    const returnOrigin = resolveOAuthReturnOrigin(
      request.session?.oauth2ReturnOrigin,
      configuration,
    );
    if (request.session) {
      delete request.session.oauth2ReturnOrigin;
    }

    // Tokens are only ever handed to `returnOrigin` (a fixed Tauri origin, the
    // server itself, or an explicitly allowed Web UI origin). Two delivery
    // modes are supported:
    //  - popup (web): post the tokens to the opener window and close, so the
    //    main window never navigates away and tokens never touch the URL.
    //  - redirect (Tauri desktop, or when popups are blocked): bounce the
    //    current window back to `returnOrigin`, which is the desktop app's own
    //    origin, keeping the Tauri IPC / ACL intact.
    const handoff = JSON.stringify({
      type: "gamevault:sso",
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token ?? null,
    });

    const htmlResponse = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>GameVault Authentication Result</title>
</head>
<body>
  <script>
    (function () {
      var handoff = ${handoff};
      var returnOrigin = ${JSON.stringify(returnOrigin)};
      try {
        if (returnOrigin && window.opener && window.opener !== window && !window.opener.closed) {
          window.opener.postMessage(handoff, returnOrigin);
          window.close();
          return;
        }
      } catch (error) {
        // Ignore and fall through to the redirect below.
      }
      var target = returnOrigin || window.location.origin;
      var query = "?access_token=" + encodeURIComponent(handoff.access_token || "") +
        (handoff.refresh_token ? "&refresh_token=" + encodeURIComponent(handoff.refresh_token) : "");
      window.location.replace(target + "/" + query);
    })();
  </script>
</body>
</html>`;

    // A response that carries tokens must never be cached.
    res.set("Cache-Control", "no-store");
    res.status(HttpStatus.OK).contentType("text/html").send(htmlResponse);
  }
}
