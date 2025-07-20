import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  NotAcceptableException,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Socket } from "socket.io";
import { SKIP_GUARDS_KEY } from "../../decorators/skip-guards.decorator";
import { Role } from "./models/role.enum";
import { ApiKeyService } from "./socket-secret.service";

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

    const client = context.switchToWs().getClient<Socket>();
    const apiKey = client.handshake.headers["x-api-key"];

    if (!apiKey) {
      this.logger.warn("Missing X-Api-Key Header.");
      client.emit("exception", {
        status: "error",
        message: "Missing X-Api-Key Header.",
      });
      return false;
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
        message: `Websocket-Client successfully authenticated.`,
        client: client.id,
        user: user.username,
      });
      context.switchToWs().getClient().gamevaultuser = { id: user.id };
      return true;
    } catch (error) {
      this.logger.error({
        message: "Websocket-Client authentication failed.",
        client: client.id,
        error,
      });
      client.emit("exception", {
        status: "error",
        message: "Unauthorized",
      });
      return false;
    }
  }
}
