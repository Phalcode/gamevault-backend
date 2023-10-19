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
import { AuthenticationGuard } from "../auth/authentication.guard";

@UseGuards(AuthenticationGuard)
@ApiBasicAuth()
@WebSocketGateway({ cors: true })
@UseFilters(WebsocketExceptionsFilter)
export class ActivityGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ActivityGateway.name);

  private activities: Activity[] = [];

  @WebSocketServer()
  server: Server;

  constructor(private usersService: UsersService) {}

  private findActivityBySocketId(userSocketId: string): Activity | undefined {
    return this.activities.find((user) => user.userSocketId === userSocketId);
  }

  private updateActivity(activity: Activity, newActivity: Activity) {
    activity.state = newActivity.state;
    activity.gameId =
      activity.state === ActivityState.PLAYING ? newActivity.gameId : undefined;
  }

  private addActivity(dto: Activity) {
    this.activities.push(dto);
  }

  @SubscribeMessage("activity")
  async setActivity(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: Activity,
  ) {
    this.logger.log(client.request);
    const req = client.request as unknown as { gamevaultuser: GamevaultUser };
    this.logger.log(req);
    const user = await this.usersService.findByUsernameOrFail(
      req.gamevaultuser.username,
    );
    dto.userId = user.id;
    dto.userSocketId = client.id;
    const activity = this.findActivityBySocketId(dto.userSocketId);
    activity ? this.updateActivity(activity, dto) : this.addActivity(dto);
    this.server.emit("activities", this.activities);
  }

  @SubscribeMessage("activities")
  getActivities(@ConnectedSocket() client: Socket) {
    client.emit("activities", this.activities);
  }

  handleConnection(client: Socket) {
    this.logger.log("Client " + client.id + " connected.");
    client.emit("activities", this.activities);
  }

  handleDisconnect(client: Socket) {
    this.logger.log("Client " + client.id + " disconnected.");
    this.activities = this.activities.filter(
      (state) => state.userSocketId != client.id,
    );
  }
}
