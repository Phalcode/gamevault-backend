import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import configuration from "../../../configuration";
import { MINIMUM_ROLE_KEY } from "../../../decorators/minimum-role.decorator";
import { Role } from "../../users/models/role.enum";
import { UsersService } from "../../users/users.service";

@Injectable()
export class AuthorizationGuard implements CanActivate {
  private readonly logger = new Logger(this.constructor.name);
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {
    if (configuration.TESTING.AUTHENTICATION_DISABLED) {
      this.logger.warn({
        message: "Skipping Authorization Checks.",
        reason: "TESTING_AUTHENTICATION_DISABLED is set to true.",
      });
    }
  }

  /** Determines whether the route can be activated. */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skippedGuards = this.reflector.getAllAndOverride<string[]>(
      "skip-guards",
      [context.getHandler(), context.getClass()],
    );
    const request = context.switchToHttp().getRequest();

    if (skippedGuards?.includes(this.constructor.name)) {
      return true;
    }

    if (configuration.TESTING.AUTHENTICATION_DISABLED) {
      const user = (await this.usersService.find())[0];
      this.logger.debug({
        message: "Skipping Authorization Checks and using first user.",
        reason: "TESTING_AUTHENTICATION_DISABLED is set to true.",
        username: user.username,
      });
      request.user = user;
      return true;
    }

    const requiredRole = this.reflector.get<Role>(
      MINIMUM_ROLE_KEY,
      context.getHandler(),
    );

    if (!requiredRole) {
      return true;
    }

    const userRole: Role = request.user.role;

    if (userRole < requiredRole) {
      throw new ForbiddenException(
        `Authorization Failed: Insufficient Role. You need to be '${Role[requiredRole]}' to do this, but you are a '${Role[userRole]}'.`,
      );
    }
    return true;
  }
}
