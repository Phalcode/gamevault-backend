import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotAcceptableException,
  StreamableFile,
  UnauthorizedException,
} from "@nestjs/common";
import { exec } from "child_process";
import fsExtra from "fs-extra";
import path from "path";
import filenameSanitizer from "sanitize-filename";
import { DataSource } from "typeorm";
import unidecode from "unidecode";
import { promisify } from "util";
const { copyFile, createReadStream, pathExists, stat, writeFile } = fsExtra;

import type { AppConfiguration } from "../../configuration.js";
import { InjectGamevaultConfig } from "../../decorators/inject-gamevault-config.decorator.js";

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(this.constructor.name);
  private readonly execPromise = promisify(exec);

  constructor(
    private readonly dataSource: DataSource,
    @InjectGamevaultConfig() private readonly config: AppConfiguration,
  ) {}

  async backup(password: string): Promise<StreamableFile> {
    if (this.config.TESTING.IN_MEMORY_DB) {
      throw new NotAcceptableException(
        "This server can't backup its data as it uses an in-memory database.",
      );
    }

    this.validatePassword(password);

    switch (this.config.DB.SYSTEM) {
      case "POSTGRESQL":
        return this.backupPostgresql(this.generateBackupFilepath());
      case "SQLITE":
        await this.disconnect();
        try {
          return await this.backupSqlite(this.generateBackupFilepath());
        } finally {
          await this.connect();
        }
      default:
        throw new InternalServerErrorException(
          "This server's DB_SYSTEM environment variable is set to an unknown value.",
        );
    }
  }

  async restore(file: Express.Multer.File, password: string) {
    if (this.config.TESTING.IN_MEMORY_DB) {
      throw new NotAcceptableException(
        "This server can't restore backups as it uses an in-memory database.",
      );
    }

    this.validatePassword(password);

    switch (this.config.DB.SYSTEM) {
      case "POSTGRESQL":
        await this.restorePostgresql(file);
        break;
      case "SQLITE":
        await this.disconnect();
        try {
          await this.restoreSqlite(file);
        } finally {
          await this.connect();
        }
        break;
      default:
        throw new InternalServerErrorException(
          "This server's DB_SYSTEM environment variable is set to an unknown value.",
        );
    }

    await this.migrate();
  }

  async connect() {
    this.logger.log("Connecting Database...");
    return this.dataSource.initialize();
  }

  async disconnect() {
    this.logger.log("Disconnecting Database...");
    return this.dataSource.destroy();
  }

  async migrate() {
    this.logger.log("Migrating Database...");
    return this.dataSource.runMigrations();
  }

  async backupPostgresql(backupFilePath: string): Promise<StreamableFile> {
    this.logger.log({
      message: "Backing up PostgreSQL Database...",
      backupFilePath,
    });
    try {
      await this.execPromise(
        `pg_dump -w -F t -h ${this.config.DB.HOST} -p ${this.config.DB.PORT} -U ${this.config.DB.USERNAME} -d ${this.config.DB.DATABASE} -f ${backupFilePath}`,
        { env: { PGPASSWORD: this.config.DB.PASSWORD } },
      );

      return this.createStreamableFile(backupFilePath);
    } catch (error) {
      this.handleBackupError(error);
      throw new InternalServerErrorException(
        "Failed to backup PostgreSQL database.",
        { cause: error },
      );
    }
  }

  private async backupSqlite(backupFilePath: string): Promise<StreamableFile> {
    this.logger.log({
      message: "Backing up SQLite Database...",
      backupFilePath,
    });
    await copyFile(
      `${this.config.VOLUMES.SQLITEDB}/database.sqlite`,
      backupFilePath,
    );

    return this.createStreamableFile(backupFilePath);
  }

  async restorePostgresql(file: Express.Multer.File) {
    this.logger.log({
      message: "Restoring PostgreSQL Database...",
      size: file.size,
    });
    try {
      await this.backupPostgresql("/tmp/gamevault_database_pre_restore.db");

      await writeFile("/tmp/gamevault_database_restore.db", file.buffer);

      await this.execPromise(
        `dropdb --if-exists -f -w -h ${this.config.DB.HOST} -p ${this.config.DB.PORT} -U ${this.config.DB.USERNAME} ${this.config.DB.DATABASE}`,
        { env: { PGPASSWORD: this.config.DB.PASSWORD } },
      );

      await this.execPromise(
        `createdb -w -h ${this.config.DB.HOST} -p ${this.config.DB.PORT} -U ${this.config.DB.USERNAME} ${this.config.DB.DATABASE}`,
        { env: { PGPASSWORD: this.config.DB.PASSWORD } },
      );

      try {
        await this.execPromise(
          `pg_restore -O -w -F t -h ${this.config.DB.HOST} -p ${this.config.DB.PORT} -U ${this.config.DB.USERNAME} -d ${this.config.DB.DATABASE} /tmp/gamevault_database_restore.db`,
          { env: { PGPASSWORD: this.config.DB.PASSWORD } },
        );

        this.logger.log("Successfully restored PostgreSQL Database.");
      } catch (error) {
        this.logger.warn({
          message:
            "Restoring your backup might have encountered an issue. Please examine the logs. If it reads 'pg_restore: warning: errors ignored on restore,' things are likely alright. It could have succeeded.",
          error,
        });
      }
    } catch (error) {
      this.logger.error({
        message: "Error restoring PostgreSQL database",
        error,
      });

      if (await pathExists("/tmp/gamevault_database_pre_restore.db")) {
        this.logger.log("Restoring pre-restore database.");
        try {
          await this.execPromise(
            `dropdb --if-exists -f -w -h ${this.config.DB.HOST} -p ${this.config.DB.PORT} -U ${this.config.DB.USERNAME} ${this.config.DB.DATABASE}`,
            { env: { PGPASSWORD: this.config.DB.PASSWORD } },
          );

          await this.execPromise(
            `createdb -w -h ${this.config.DB.HOST} -p ${this.config.DB.PORT} -U ${this.config.DB.USERNAME} ${this.config.DB.DATABASE}`,
            { env: { PGPASSWORD: this.config.DB.PASSWORD } },
          );

          await this.execPromise(
            `pg_restore -O -w -F t -h ${this.config.DB.HOST} -p ${this.config.DB.PORT} -U ${this.config.DB.USERNAME} -d ${this.config.DB.DATABASE} /tmp/gamevault_database_pre_restore.db`,
            { env: { PGPASSWORD: this.config.DB.PASSWORD } },
          );
          this.logger.log("Restored pre-restore database.");
        } catch (error) {
          this.logger.error({
            message:
              "Errors occured restoring pre-restore PostgreSQL database. Please restore the backup manually.",
            error,
          });
          throw new InternalServerErrorException(
            "Error restoring pre-restore PostgreSQL Database.",
            { cause: error },
          );
        }
      }
    }
  }

  private async restoreSqlite(file: Express.Multer.File) {
    this.logger.log({
      message: "Restoring SQLITE Database...",
      size: file.size,
    });
    try {
      if (await pathExists(`${this.config.VOLUMES.SQLITEDB}/database.sqlite`)) {
        this.backupSqlite("/tmp/gamevault_database_pre_restore.db");
      }
      await writeFile(
        `${this.config.VOLUMES.SQLITEDB}/database.sqlite`,
        file.buffer,
      );
    } catch (error) {
      this.logger.error({ message: "Error restoring SQLITE database", error });
      if (await pathExists("/tmp/gamevault_database_pre_restore.db")) {
        this.logger.log("Restoring pre-restore database.");
        await copyFile(
          "/tmp/gamevault_database_pre_restore.db",
          `${this.config.VOLUMES.SQLITEDB}/database.sqlite`,
        );
        this.logger.log("Restored pre-restore database.");
      }
    }
  }

  private validatePassword(password: string) {
    if (this.config.DB.PASSWORD !== password) {
      throw new UnauthorizedException(
        "The database password provided in the X-Database-Password Header is incorrect.",
      );
    }
  }

  private generateBackupFilepath(): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-");
    return `/tmp/gamevault_${this.config.SERVER.VERSION}_database_backup_${timestamp}.db`;
  }

  private async createStreamableFile(
    filePath: string,
  ): Promise<StreamableFile> {
    const file = createReadStream(filePath);
    const length = (await stat(filePath)).size;
    const { default: mime } = await import("mime");
    const type = mime.getType(filePath);
    const filename = filenameSanitizer(unidecode(path.basename(filePath)));

    return new StreamableFile(file, {
      disposition: `attachment; filename="${filename}"`,
      length,
      type: type ?? undefined,
    });
  }

  private handleBackupError(error: unknown) {
    this.logger.error({ message: "Error backing up database", error });
    throw new InternalServerErrorException("Error backing up database.", {
      cause: error,
    });
  }
}
