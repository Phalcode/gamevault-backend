import { Logger, UseFilters, UseGuards } from "@nestjs/common";
import { AsyncApiPub, AsyncApiSub } from "nestjs-asyncapi";
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
import { Activity } from "./models/activity.dto";
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

  @AsyncApiSub({
    channel: "set-activity",
    operationId: "set-activity",
    summary: "sets the activity of your user.",
    tags: [{ name: "activity" }],
    message: {
      payload: Activity,
    },
  })
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
    dto.user_id = user.id;
    dto.socket_id = client.id;
    dto.game_id = dto.state === ActivityState.PLAYING ? dto.game_id : undefined;
    this.activities.set(dto.user_id, dto);
    this.logger.log(this.getAll());
    this.server.emit("activities", this.getAll());
  }

  @AsyncApiSub({
    channel: "get-activities",
    operationId: "get-activities",
    summary: "request all activities",
    tags: [{ name: "activity" }],
    message: { payload: Object },
  })
  @AsyncApiPub({
    channel: "activities",
    operationId: "activities",
    summary: "sends all activites to all users.",
    tags: [{ name: "activity" }],
    message: {
      payload: Array<Activity>,
    },
  })
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
      if (activity.socket_id === client.id) {
        this.activities.delete(userId);
      }
    }
  }

  private getAll() {
    return [...this.activities.values()];
  }
}