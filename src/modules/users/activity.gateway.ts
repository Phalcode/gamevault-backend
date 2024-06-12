import { Logger, UseFilters, UseGuards } from "@nestjs/common";
import { ApiBasicAuth } from "@nestjs/swagger";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { AsyncApiPub, AsyncApiSub } from "nestjs-asyncapi";
import { noop } from "rxjs";
import { Server, Socket } from "socket.io";

import configuration from "../../configuration";
import { WebsocketExceptionsFilter } from "../../filters/websocket-exceptions.filter";
import { SocketSecretGuard } from "../guards/socket-secret.guard";
import { GamevaultUser } from "./gamevault-user.entity";
import { Activity } from "./models/activity.dto";
import { ActivityState } from "./models/activity-state.enum";
import { UsersService } from "./users.service";

// Conditionally decorate the WebSocket gateway class.
const ConditionalWebSocketGateway = configuration.SERVER
  .ONLINE_ACTIVITIES_DISABLED
  ? noop
  : WebSocketGateway({ cors: true });

@UseGuards(SocketSecretGuard)
@ApiBasicAuth()
@ConditionalWebSocketGateway
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
  @AsyncApiPub({
    channel: "activities",
    operationId: "activity",
    summary: "sends the new activiy to all users.",
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
    const user = await this.usersService.findOneByUserIdOrFail(
      requestingUser.gamevaultuser.id,
    );
    dto.user_id = user.id;
    dto.socket_id = client.id;
    dto.game_id = dto.state === ActivityState.PLAYING ? dto.game_id : undefined;
    this.activities.set(dto.user_id, dto);
    this.server.emit("activity", dto);
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
    this.logger.log({ message: "Client connected.", client: client.id });
    client.emit("activities", this.getAll());
  }

  handleDisconnect(client: Socket) {
    this.logger.log({ message: "Client disconnected.", client: client.id });
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
