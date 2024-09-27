import { Injectable } from "@nestjs/common";

import configuration from "../../configuration";
import { HealthStatus } from "./models/health-status.enum";
import { Health, HealthProtocolEntry } from "./models/health.model";

@Injectable()
export class HealthService {
  private readonly epoch: Date = new Date();
  private currentHealth: Health = new Health();

  constructor() {
    this.set(HealthStatus.HEALTHY, "Server started successfully");
    this.currentHealth = this.getExtensive();
  }

  getExtensive(): Health {
    const newHealth = new Health();
    newHealth.version = configuration.SERVER.VERSION;
    newHealth.uptime = Math.floor(
      (new Date().getTime() - this.epoch.getTime()) / 1000,
    );
    newHealth.status = this.currentHealth.status;
    newHealth.protocol = [...this.currentHealth.protocol];
    this.currentHealth = newHealth;
    return newHealth;
  }

  get(): Health {
    const health = this.getExtensive();
    const healthCopy = { ...health };
    delete healthCopy.protocol;
    delete healthCopy.uptime;
    delete healthCopy.version;
    return healthCopy;
  }

  set(status: HealthStatus, reason: string) {
    this.currentHealth.status = status;
    this.currentHealth.protocol.push(new HealthProtocolEntry(status, reason));
  }
}
