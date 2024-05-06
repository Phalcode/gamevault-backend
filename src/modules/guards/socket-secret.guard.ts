import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from "@nestjs/common";
import { Socket } from "socket.io";

import { SocketSecretService } from "../users/socket-secret.service";

@Injectable()
export class SocketSecretGuard implements CanActivate {
  private readonly logger = new Logger(SocketSecretGuard.name);

  constructor(private socketSecretService: SocketSecretService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
      const user = await this.socketSecretService.getUserBySocketSecretOrFail(
        socketSecret.toString(),
      );
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
