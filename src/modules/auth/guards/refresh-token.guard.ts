import { ExecutionContext, Injectable, Logger } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { SKIP_GUARDS_KEY } from "../../../decorators/skip-guards.decorator";

@Injectable()
export class RefreshTokenGuard extends AuthGuard("refresh-token") {
  private readonly logger = new Logger(this.constructor.name);
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    if (
      this.reflector
        .getAllAndOverride<
          string[]
        >(SKIP_GUARDS_KEY, [context.getHandler(), context.getClass()])
        ?.includes(this.constructor.name)
    ) {
      this.logger.debug({
        message: "Skipping Refresh Token Checks.",
        reason: "skip-guards is set to true for this route.",
        route: context.getHandler(),
      });
      return true;
    }

    return super.canActivate(context);
  }
}
