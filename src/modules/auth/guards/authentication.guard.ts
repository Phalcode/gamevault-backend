import { ExecutionContext, Injectable, Logger } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import configuration from "../../../configuration";
import { SKIP_GUARDS_KEY } from "../../../decorators/skip-guards.decorator";

@Injectable()
export class AuthenticationGuard extends AuthGuard("auth") {
  private readonly logger = new Logger(this.constructor.name);
  constructor(private readonly reflector: Reflector) {
    super();
    if (configuration.TESTING.AUTHENTICATION_DISABLED) {
      this.logger.warn({
        message: "Skipping Authentication Checks.",
        reason: "TESTING_AUTHENTICATION_DISABLED is set to true.",
      });
    }
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
        message: "Skipping Refresh Authentication Checks.",
        reason: "skip-guards is set to true for this route.",
        route: context.getHandler(),
      });
      return true;
    }

    if (configuration.TESTING.AUTHENTICATION_DISABLED) {
      this.logger.debug({
        message: "Skipping Authentication Checks.",
        reason: "TESTING_AUTHENTICATION_DISABLED is set to true.",
      });
      return true;
    }

    return super.canActivate(context);
  }
}
