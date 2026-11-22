import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  HttpStatus,
  Logger,
  Post,
  Request,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBody,
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
import { AuthenticationGuard } from "../guards/authentication.guard.js";
import { AuthorizationGuard } from "../guards/authorization.guard.js";
import { Oauth2Guard } from "../guards/oauth2.guard.js";
import { OAuth2TokenRequestDto } from "../models/oauth2-token-request.dto.js";
import { TokenPairDto } from "../models/token-pair.dto.js";
import {
  isLoopbackOrigin,
  resolveOAuthReturnOrigin,
} from "../oauth-return-origin.js";
import { OAuth2LoginCodeService } from "../oauth2-login-code.service.js";

/**
 * Escapes the characters that would otherwise end the handoff text node early.
 * The handoff JSON is rendered as page text for clients that read it, so it has
 * to survive HTML parsing unchanged.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

@Controller("auth/oauth2")
@ApiTags("auth")
@UseGuards(Oauth2Guard)
@ApiOAuth2(configuration.AUTH.OAUTH2.SCOPES)
export class OAuth2Controller {
  private readonly logger = new Logger(this.constructor.name);
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly loginCodeService: OAuth2LoginCodeService,
  ) {}

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
      session?: { oauth2ReturnOrigin?: string; oauth2CodeChallenge?: string };
    },
    @Res() res: Response, // Inject Express Response object to customize response
  ) {
    // The origin the client asked for tokens to be returned to. Set by the
    // Oauth2Guard from the validated `client_origin` query parameter before the
    // redirect to the identity provider. `null` means either nothing was
    // requested or the requested origin is not trusted, in which case we fall
    // back to the server's own origin (the historical behaviour).
    const returnOrigin = resolveOAuthReturnOrigin(
      request.session?.oauth2ReturnOrigin,
      configuration,
    );
    const codeChallenge = request.session?.oauth2CodeChallenge;
    if (request.session) {
      delete request.session.oauth2ReturnOrigin;
      delete request.session.oauth2CodeChallenge;
    }

    // A native app's loopback listener never receives tokens in a URL. It gets
    // a one-time code and exchanges it, with its PKCE verifier, at
    // `POST /api/auth/oauth2/token` (RFC 8252, section 6).
    if (returnOrigin && isLoopbackOrigin(returnOrigin)) {
      if (!codeChallenge) {
        throw new BadRequestException(
          "Authentication Failed: No PKCE code_challenge was stored for this login attempt.",
        );
      }
      const code = this.loginCodeService.issue(request.user, codeChallenge);
      res.set("Cache-Control", "no-store");
      res.set("Referrer-Policy", "no-referrer");
      res.redirect(`${returnOrigin}/?code=${code}`);
      return;
    }

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

    // Tokens are only ever handed to `returnOrigin` (a fixed Tauri origin, the
    // server itself, or an explicitly allowed Web UI origin). Three delivery
    // modes are supported:
    //  - page text: the legacy desktop client (1.17.x) reads the rendered text
    //    of this page while it loads and parses it as the token response.
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
  <p id="gamevault-handoff" style="color: transparent; user-select: text;">${escapeHtml(
    handoff,
  )}</p>
  <script>
    (function () {
      var node = document.getElementById("gamevault-handoff");
      var handoff = JSON.parse(node ? node.textContent : "{}");
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
      // Clients that read the handoff text node do so while the document is
      // still loading, so keep the page around briefly before navigating away.
      setTimeout(function () {
        window.location.replace(target + "/" + query);
      }, 300);
    })();
  </script>
</body>
</html>`;

    // A response that carries tokens must never be cached, and it must not leak
    // the return address to anywhere else.
    res.set("Cache-Control", "no-store");
    res.set("Referrer-Policy", "no-referrer");
    res.set(
      "Content-Security-Policy",
      "default-src 'none'; script-src 'unsafe-inline'",
    );
    res.status(HttpStatus.OK).contentType("text/html").send(htmlResponse);
  }

  @Post("token")
  @SkipGuards([
    AuthenticationGuard.name,
    AuthorizationGuard.name,
    Oauth2Guard.name,
  ])
  @Header("Cache-Control", "no-store")
  @ApiOperation({
    summary: "Exchanges a one-time oauth2 login code for a bearer token.",
    description:
      "Completes an oauth2 login that was started with a loopback client_origin (http://127.0.0.1:<port> or http://[::1]:<port>) and a PKCE code_challenge. The code the loopback listener received is valid once, for a short time, and only together with the matching code_verifier.",
    operationId: "postAuthOauth2Token",
  })
  @ApiBody({ type: () => OAuth2TokenRequestDto })
  @ApiOkResponse({ type: () => TokenPairDto })
  async postAuthOauth2Token(
    @Body() dto: OAuth2TokenRequestDto,
    @Request()
    request: {
      ip: string;
      headers: { [key: string]: string };
    },
  ): Promise<TokenPairDto> {
    const user = this.loginCodeService.redeem(dto.code, dto.code_verifier);
    this.logger.log({
      message: "User logged in via oauth2.",
      user,
    });
    return this.authenticationService.login(
      user,
      request.ip,
      request.headers["user-agent"] || "unknown",
    );
  }
}
