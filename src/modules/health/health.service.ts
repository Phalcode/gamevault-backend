import { Injectable } from "@nestjs/common";
import { Health, HealthProtocolEntry } from "./models/health.model";
import configuration from "../../configuration";
import { HealthStatus } from "./models/health-status.enum";
import { UsersService } from "../users/users.service";
import { Role } from "../users/models/role.enum";

@Injectable()
export class HealthService {
  private epoch: Date = new Date();
  private currentHealth: Health = new Health();

  constructor(private usersService: UsersService) {
    this.set(HealthStatus.HEALTHY, "Server started successfully");
    this.currentHealth = this.getFullInformation();
  }

  private getFullInformation(): Health {
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

  async get(username?: string): Promise<Health> {
    const health = this.getFullInformation();

    const isAdmin =
      username &&
      (await this.usersService.checkIfUsernameIsAtLeastRole(
        username,
        Role.ADMIN,
      ));

    if (!isAdmin) {
      const healthCopy = { ...health };
      delete healthCopy.protocol;
      delete healthCopy.uptime;
      delete healthCopy.version;
      return healthCopy;
    }

    return health;
  }

  set(status: HealthStatus, reason: string) {
    this.currentHealth.status = status;
    this.currentHealth.protocol.push(new HealthProtocolEntry(status, reason));
  }
}
