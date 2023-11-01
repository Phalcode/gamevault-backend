import {
  Injectable,
  CanActivate,
  ExecutionContext,
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
      this.logger.debug(
        `Client ${client.id} successfully authenticated as ${user.username}`,
      );
      context.switchToWs().getClient().gamevaultuser = { id: user.id };
      return true;
    } catch (error) {
      this.logger.error(error, `Authentication failed for client ${client.id}`);
      client.emit("exception", {
        status: "error",
        message: "Unauthorized.",
      });
      return false;
    }
  }
}
