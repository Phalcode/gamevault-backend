import { ExecutionContext, Injectable, Logger } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";

import configuration from "../../../configuration";

@Injectable()
export class AuthenticationGuard extends AuthGuard("basic") {
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

  /** Determines whether the route can be activated. */
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.get<boolean>(
      "public",
      context.getHandler(),
    );

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
