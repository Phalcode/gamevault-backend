import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { randomUUID } from "node:crypto";
import { Repository } from "typeorm";
import { GamevaultServer } from "./gamevault-server.entity.js";

@Injectable()
export class ServerService implements OnModuleInit {
  private readonly logger = new Logger(ServerService.name);
  private serverUuid!: string;

  constructor(
    @InjectRepository(GamevaultServer)
    private readonly repository: Repository<GamevaultServer>,
  ) {}

  async onModuleInit(): Promise<void> {
    const existing = await this.repository.findOne({ where: {} });
    if (existing) {
      this.serverUuid = existing.uuid;
    } else {
      this.serverUuid = randomUUID();
      await this.repository.save(
        this.repository.create({ uuid: this.serverUuid }),
      );
      this.logger.log(`Created server UUID: ${this.serverUuid}`);
    }
  }

  getServerUuid(): string | undefined {
    return this.serverUuid;
  }
}
