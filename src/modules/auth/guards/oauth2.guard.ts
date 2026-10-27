import { type ExecutionContext, Injectable, Logger } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { type AppConfiguration } from "../../../configuration.js";
import { InjectGamevaultConfig } from "../../../decorators/inject-gamevault-config.decorator.js";
import { SKIP_GUARDS_KEY } from "../../../decorators/skip-guards.decorator.js";
import { resolveOAuthReturnOrigin } from "../oauth-return-origin.js";

/** The subset of the Express request this guard relies on. */
interface OAuth2Request {
  query?: Record<string, unknown>;
  session?: { oauth2ReturnOrigin?: string };
}

@Injectable()
export class Oauth2Guard extends AuthGuard("oauth2") {
  private readonly logger = new Logger(this.constructor.name);
  constructor(
    private readonly reflector: Reflector,
    @InjectGamevaultConfig() private readonly config: AppConfiguration,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    if (
      this.reflector
        .getAllAndOverride<string[]>(SKIP_GUARDS_KEY, [
          context.getHandler(),
          context.getClass(),
        ])
        ?.includes(this.constructor.name)
    ) {
      return true;
    }

    return super.canActivate(context);
  }

  /**
   * Runs on every OAuth2 round trip. On the initial request (the one without an
   * authorization `code`) we remember where the client wants its tokens
   * delivered, so the callback can hand them back to the right origin. This is
   * what keeps the Tauri desktop app on its own origin instead of stranding the
   * WebView on the remote server origin.
   *
   * The session (already populated by express-session) carries the value across
   * the redirect to the identity provider and back, which is the only reliable
   * channel available — the `client_origin` query parameter itself does not
   * survive the round trip.
   */
  override getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<OAuth2Request>();
    const isInitialRequest = typeof request?.query?.code !== "string";

    if (isInitialRequest && request?.session) {
      const origin = resolveOAuthReturnOrigin(
        request.query?.client_origin,
        this.config,
      );
      if (origin) {
        request.session.oauth2ReturnOrigin = origin;
      } else {
        // No (or an untrusted) return origin was requested: make sure a stale
        // value from a previous attempt can't leak into this flow.
        delete request.session.oauth2ReturnOrigin;
      }
    }

    return super.getAuthenticateOptions(context);
  }
}
