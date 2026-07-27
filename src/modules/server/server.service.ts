import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { randomUUID } from "crypto";
import { Repository } from "typeorm";
import { GamevaultServer } from "./gamevault-server.entity";

@Injectable()
export class ServerService implements OnModuleInit {
  private serverUuid: string;

  constructor(
    @InjectRepository(GamevaultServer)
    private readonly repository: Repository<GamevaultServer>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.initializeUuid();
  }

  /**
   * Returns the persistent server UUID.
   * If not yet initialized (e.g. onModuleInit hasn't run), lazily initializes it.
   */
  getServerUuid(): string {
    if (!this.serverUuid) {
      // Lazy fallback — fire and forget; next call will have the cached value.
      // In practice onModuleInit always runs first, so this is a safety net.
      this.initializeUuid().catch(() => {});
      return undefined;
    }
    return this.serverUuid;
  }

  private async initializeUuid(): Promise<void> {
    const existing = await this.repository.findOne({ where: {} });
    if (existing) {
      this.serverUuid = existing.uuid;
    } else {
      this.serverUuid = randomUUID();
      await this.repository.save(
        this.repository.create({ uuid: this.serverUuid }),
      );
    }
  }
}
