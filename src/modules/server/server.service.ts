import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { randomUUID } from "crypto";
import { Repository } from "typeorm";
import { GamevaultServer } from "./gamevault-server.entity";

@Injectable()
export class ServerService implements OnModuleInit {
  private readonly logger = new Logger(ServerService.name);
  private serverUuid: string | null = null;
  private initPromise: Promise<void> | null = null;

  constructor(
    @InjectRepository(GamevaultServer)
    private readonly repository: Repository<GamevaultServer>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureInitialized();
  }

  /**
   * Returns the persistent server UUID.
   *
   * Generated once on first startup and stored in the `gamevault_server`
   * database table. Survives restarts, database migrations, and URL changes —
   * clients can rely on this value to recognize the same logical server.
   *
   * @returns The UUID, or `undefined` during early module construction
   *          (before {@link onModuleInit} completes). At request time the
   *          UUID is always available.
   */
  getServerUuid(): string | undefined {
    if (this.serverUuid === null) {
      this.ensureInitialized().catch((error) => {
        this.logger.error(
          `Lazy server UUID initialization failed: ${error}`,
          error.stack,
        );
      });
      return undefined;
    }
    return this.serverUuid;
  }

  /**
   * Ensures the UUID is loaded or created, reusing an in-flight
   * initialization to prevent concurrent database calls.
   */
  private async ensureInitialized(): Promise<void> {
    if (this.serverUuid !== null) return;

    if (!this.initPromise) {
      this.initPromise = this.loadOrCreateUuid().finally(() => {
        // Allow retry on failure: only clear the promise if we still
        // don't have a UUID (so success keeps the short-circuit fast).
        if (this.serverUuid === null) {
          this.initPromise = null;
        }
      });
    }

    await this.initPromise;
  }

  /**
   * Loads the existing server UUID from the database or creates a new one.
   * Handles duplicate rows (leftover from earlier race-condition bugs) by
   * keeping the oldest row and removing the rest.
   */
  private async loadOrCreateUuid(): Promise<void> {
    const rows = await this.repository.find({ take: 2 });

    if (rows.length > 1) {
      this.logger.warn(
        `Found ${rows.length} rows in gamevault_server — ` +
          `keeping row ${rows[0].id} and removing duplicates.`,
      );
      const [keep, ...rest] = rows;
      await this.repository.remove(rest);
      this.serverUuid = keep.uuid;
    } else if (rows.length === 1) {
      this.serverUuid = rows[0].uuid;
    } else {
      this.serverUuid = randomUUID();
      await this.repository.save(
        this.repository.create({ uuid: this.serverUuid }),
      );
      this.logger.log(`Created server UUID: ${this.serverUuid}`);
    }
  }
}
