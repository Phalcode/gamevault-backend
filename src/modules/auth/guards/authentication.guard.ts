import { ExecutionContext, Injectable, Logger } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import configuration from "../../../configuration";

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
    const skippedGuards = this.reflector.getAllAndOverride<string[]>(
      "skip-guards",
      [context.getHandler(), context.getClass()],
    );

    if (skippedGuards?.includes(this.constructor.name)) {
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
