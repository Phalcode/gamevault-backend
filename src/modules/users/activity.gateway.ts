import { Logger, UseFilters, UseGuards } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Activity } from "./models/activity";
import { ApiBasicAuth } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { ActivityState } from "./models/activity-state.enum";
import { GamevaultUser } from "./gamevault-user.entity";
import { WebsocketExceptionsFilter } from "../../filters/websocket-exceptions.filter";
import { SocketSecretGuard } from "../guards/socket-secret.guard";

@UseGuards(SocketSecretGuard)
@ApiBasicAuth()
@WebSocketGateway({ cors: true })
@UseFilters(WebsocketExceptionsFilter)
export class ActivityGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ActivityGateway.name);

  private activities: Map<number, Activity> = new Map<number, Activity>();

  @WebSocketServer()
  server: Server;

  constructor(private usersService: UsersService) {}

  @SubscribeMessage("set-activity")
  async setActivity(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: Activity,
  ) {
    const requestingUser = client as unknown as {
      gamevaultuser: GamevaultUser;
    };
    const user = await this.usersService.findByIdOrFail(
      requestingUser.gamevaultuser.id,
    );
    dto.userId = user.id;
    dto.socketId = client.id;
    dto.gameId = dto.state === ActivityState.PLAYING ? dto.gameId : undefined;
    this.activities.set(dto.userId, dto);
    this.logger.log(this.getAll());
    this.server.emit("activities", this.getAll());
  }

  @SubscribeMessage("get-activities")
  getActivities(@ConnectedSocket() client: Socket) {
    client.emit("activities", this.getAll());
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client ${client.id} connected.`);
    client.emit("activities", this.getAll());
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client ${client.id} disconnected.`);
    for (const [userId, activity] of this.activities) {
      if (activity.socketId === client.id) {
        this.activities.delete(userId);
      }
    }
  }

  private getAll() {
    return [...this.activities.values()];
  }
}
