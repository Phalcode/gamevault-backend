import { Injectable, ExecutionContext, Logger } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import configuration from "../../configuration";

@Injectable()
export class AuthenticationGuard extends AuthGuard("basic") {
  private readonly logger = new Logger(AuthenticationGuard.name);

  constructor(private readonly reflector: Reflector) {
    super();
    if (configuration.TESTING.AUTHENTICATION_DISABLED) {
      this.logger.warn(
        "Not checking Authentication as TESTING_AUTHENTICATION_DISABLED is true",
      );
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

    if (configuration.TESTING.AUTHENTICATION_DISABLED) {
      return true;
    }

    return super.canActivate(context);
  }
}
