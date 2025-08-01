import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  NotAcceptableException,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { Socket } from "socket.io";
import configuration from "../../../configuration";
import { SKIP_GUARDS_KEY } from "../../../decorators/skip-guards.decorator";
import { ApiKeyService } from "../../users/api-key.service";
import { Role } from "../../users/models/role.enum";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly apiKeyService: ApiKeyService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (
      this.reflector
        .getAllAndOverride<
          string[]
        >(SKIP_GUARDS_KEY, [context.getHandler(), context.getClass()])
        ?.includes(this.constructor.name)
    ) {
      return true;
    }

    if (configuration.TESTING.AUTHENTICATION_DISABLED) {
      this.logger.debug({
        message: "Skipping Authentication Checks.",
        reason: "TESTING_AUTHENTICATION_DISABLED is set to true.",
      });
      return true;
    }

    const isWebsocketProtocol = context.getType<"ws" | "http">() === "ws";

    const apiKey = isWebsocketProtocol
      ? context.switchToWs().getClient<Socket>().handshake.headers["x-api-key"]
      : context.switchToHttp().getRequest<Request>().headers["x-api-key"];

    if (!apiKey) {
      if (isWebsocketProtocol) {
        context.switchToWs().getClient<Socket>().emit("exception", {
          status: "error",
          message: "Missing X-Api-Key Header.",
        });
      }
      return true;
    }

    try {
      const user = await this.apiKeyService.findUserByApiKeyOrFail(
        apiKey.toString(),
      );

      if (user.deleted_at) {
        throw new UnauthorizedException(
          "Authentication Failed: User has been deleted. Contact an Administrator to recover the User.",
        );
      }
      if (!user.activated && user.role !== Role.ADMIN) {
        throw new NotAcceptableException(
          "Authorization Failed: User is not activated. Contact an Administrator to activate the User.",
        );
      }

      this.logger.debug({
        message: `Client authenticated in via API-Key.`,
        protocol: isWebsocketProtocol ? "WebSocket" : "HTTP",
        user: user.username,
      });

      if (isWebsocketProtocol) {
        context.switchToWs().getClient().user = user;
      } else {
        context.switchToHttp().getRequest().user = user;
      }

      return true;
    } catch (error) {
      this.logger.error({
        message: `${isWebsocketProtocol ? "WebSocket" : "HTTP"} authentication failed.`,
        error,
      });

      if (isWebsocketProtocol) {
        context.switchToWs().getClient<Socket>().emit("exception", {
          status: "error",
          message: "Unauthorized",
        });
        return false;
      }

      throw new UnauthorizedException(
        "Authentication Failed: Invalid API-Key. If you are a new user, please register first.",
      );
    }
  }
}
