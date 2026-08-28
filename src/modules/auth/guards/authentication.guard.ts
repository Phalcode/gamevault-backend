import { ExecutionContext, Injectable, Logger } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { AppConfiguration } from "../../../configuration";
import { InjectGamevaultConfig } from "../../../decorators/inject-gamevault-config.decorator";
import { SKIP_GUARDS_KEY } from "../../../decorators/skip-guards.decorator";

@Injectable()
export class AuthenticationGuard extends AuthGuard("auth") {
  private readonly logger = new Logger(this.constructor.name);
  constructor(
    private readonly reflector: Reflector,
    @InjectGamevaultConfig() private readonly config: AppConfiguration,
  ) {
    super();
    if (this.config.TESTING.AUTHENTICATION_DISABLED) {
      this.logger.warn({
        message: "Skipping Authentication Checks.",
        reason: "TESTING_AUTHENTICATION_DISABLED is set to true.",
      });
    }
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

    if (this.config.TESTING.AUTHENTICATION_DISABLED) {
      this.logger.debug({
        message: "Skipping Authentication Checks.",
        reason: "TESTING_AUTHENTICATION_DISABLED is set to true.",
      });
      return true;
    }

    if (context.switchToHttp().getRequest().user) {
      this.logger.debug({
        message: "Skipping Authentication Checks.",
        reason: "User is already authenticated.",
      });
      return true;
    }

    return super.canActivate(context);
  }
}
