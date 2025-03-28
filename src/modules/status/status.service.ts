import { Injectable } from "@nestjs/common";

import { StatusEnum } from "./models/status.enum";
import { Status, StatusEntry } from "./models/status.model";

@Injectable()
export class StatusService {
  private readonly epoch: Date = new Date();
  private currentStatus: Status = new Status(this.epoch, []);

  constructor() {
    this.set(StatusEnum.HEALTHY, "Server started successfully");
    this.currentStatus = this.getExtensive();
  }

  getExtensive(): Status {
    this.currentStatus = new Status(this.epoch, [
      ...this.currentStatus.protocol,
    ]);
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
    this.currentStatus.protocol.push(new StatusEntry(status, reason));
  }
}
