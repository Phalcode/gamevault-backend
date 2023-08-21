import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import configuration from "../../configuration";
import { Role } from "../users/models/role.enum";

@Injectable()
export class AuthorizationGuard implements CanActivate {
  private readonly logger = new Logger(AuthorizationGuard.name);
  constructor(private readonly reflector: Reflector) {
    if (configuration.TESTING.AUTHENTICATION_DISABLED) {
      this.logger.warn(
        "Not checking Authorization as TESTING_AUTHENTICATION_DISABLED is true",
      );
    }
  }

  /**
   * Determines whether the route can be activated.
   *
   * @param context - The execution context.
   * @returns A boolean indicating if the route can be activated.
   * @throws {ForbiddenException} If the user role is insufficient to access the
   *   route.
   */
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
      "minimumRole",
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
