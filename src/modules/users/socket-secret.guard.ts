import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Socket } from "socket.io";
import { SKIP_GUARDS_KEY } from "../../decorators/skip-guards.decorator";
import { Role } from "./models/role.enum";
import { SocketSecretService } from "./socket-secret.service";

@Injectable()
export class SocketSecretGuard implements CanActivate {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly socketSecretService: SocketSecretService,
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
    const socketSecret = client.handshake.headers["x-socket-secret"];

    if (!socketSecret) {
      this.logger.warn("Missing X-Socket-Secret Header.");
      client.emit("exception", {
        status: "error",
        message: "Missing X-Socket-Secret Header.",
      });
      return false;
    }

    try {
      const user = await this.socketSecretService.findUserBySocketSecretOrFail(
        socketSecret.toString(),
      );

      if (user.deleted_at) {
        throw new UnauthorizedException(
          "Authentication Failed: User has been deleted. Contact an Administrator to recover the User.",
        );
      }
      if (!user.activated && user.role !== Role.ADMIN) {
        throw new ForbiddenException(
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
