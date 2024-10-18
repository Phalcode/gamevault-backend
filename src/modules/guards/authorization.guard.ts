import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import configuration from "../../configuration";
import { MINIMUM_ROLE_KEY } from "../../decorators/minimum-role.decorator";
import { Role } from "../users/models/role.enum";

@Injectable()
export class AuthorizationGuard implements CanActivate {
  private readonly logger = new Logger(this.constructor.name);
  constructor(private readonly reflector: Reflector) {
    if (configuration.TESTING.AUTHENTICATION_DISABLED) {
      this.logger.warn({
        message: "Skipping Authorization Checks.",
        reason: "TESTING_AUTHENTICATION_DISABLED is set to true.",
      });
    }
  }

  /** Determines whether the route can be activated. */
  canActivate(context: ExecutionContext): boolean {
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

    const requiredRole = this.reflector.get<Role>(
      MINIMUM_ROLE_KEY,
      context.getHandler(),
    );

    if (!requiredRole) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userRole: Role = request.gamevaultuser.role;

    if (userRole < requiredRole) {
      throw new ForbiddenException(
        `Insufficient Role. You need to be '${Role[requiredRole]}' to do this, but you are a '${Role[userRole]}'.`,
      );
    }
    return true;
  }
}
