import { Injectable, Optional } from "@nestjs/common";

import { ServerService } from "../server/server.service.js";
import { StatusEnum } from "./models/status.enum.js";
import { Status, StatusEntry } from "./models/status.model.js";

@Injectable()
export class StatusService {
  private readonly epoch: Date = new Date();
  private currentStatus: Status;

  constructor(@Optional() private readonly serverService?: ServerService) {
    this.currentStatus = new Status(this.epoch, []);
    this.set(StatusEnum.HEALTHY, "Server started successfully");
    this.currentStatus = this.getExtensive();
  }

  getExtensive(): Status {
    this.currentStatus = new Status(
      this.epoch,
      [...(this.currentStatus.protocol ?? [])],
      this.serverService?.getServerUuid(),
    );
    return this.currentStatus;
  }

  get(): Status {
    const status = this.getExtensive();
    const statusCopy = { ...status };
    delete statusCopy.protocol;
    delete statusCopy.uptime;
    return statusCopy;
  }

  set(status: StatusEnum, reason: string) {
    this.currentStatus.status = status;
    this.currentStatus.protocol ??= [];
    this.currentStatus.protocol.push(new StatusEntry(status, reason));
  }
}
