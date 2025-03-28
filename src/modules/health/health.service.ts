import { Injectable } from "@nestjs/common";

import { HealthStatus } from "./models/health-status.enum";
import { Health, HealthProtocolEntry } from "./models/health.model";

@Injectable()
export class HealthService {
  private readonly epoch: Date = new Date();
  private currentHealth: Health = new Health(this.epoch, []);

  constructor() {
    this.set(HealthStatus.HEALTHY, "Server started successfully");
    this.currentHealth = this.getExtensive();
  }

  getExtensive(): Health {
    this.currentHealth = new Health(this.epoch, [
      ...this.currentHealth.protocol,
    ]);
    return this.currentHealth;
  }

  get(): Health {
    const health = this.getExtensive();
    const healthCopy = { ...health };
    delete healthCopy.protocol;
    delete healthCopy.uptime;
    return healthCopy;
  }

  set(status: HealthStatus, reason: string) {
    this.currentHealth.status = status;
    this.currentHealth.protocol.push(new HealthProtocolEntry(status, reason));
  }
}
