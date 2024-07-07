import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotAcceptableException,
  StreamableFile,
  UnauthorizedException,
} from "@nestjs/common";
import { exec } from "child_process";
import { createReadStream, existsSync, statSync } from "fs";
import { copyFile, writeFile } from "fs/promises";
import mime from "mime";
import path from "path";
import filenameSanitizer from "sanitize-filename";
import { DataSource } from "typeorm";
import unidecode from "unidecode";
import { promisify } from "util";

import configuration from "../../configuration";

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(this.constructor.name);
  private execPromise = promisify(exec);

  constructor(private dataSource: DataSource) {}

  async backup(password: string): Promise<StreamableFile> {
    if (configuration.TESTING.IN_MEMORY_DB) {
      throw new NotAcceptableException(
        "This server can't backup its data as it uses an in-memory database.",
      );
    }

    this.validatePassword(password);
    await this.disconnect();

    let backupFile: Promise<StreamableFile>;

    switch (configuration.DB.SYSTEM) {
      case "POSTGRESQL":
        backupFile = this.backupPostgresql(this.generateBackupFilepath());
        break;
      case "SQLITE":
        backupFile = this.backupSqlite(this.generateBackupFilepath());
        break;
      default:
        throw new InternalServerErrorException(
          "This server's DB_SYSTEM environment variable is set to an unknown value.",
        );
    }

    await this.connect();
    return backupFile;
  }

  async restore(file: Express.Multer.File, password: string) {
    if (configuration.TESTING.IN_MEMORY_DB) {
      throw new NotAcceptableException(
        "This server can't restore backups as it uses an in-memory database.",
      );
    }

    this.validatePassword(password);
    await this.disconnect();

    switch (configuration.DB.SYSTEM) {
      case "POSTGRESQL":
        await this.restorePostgresql(file);
        break;
      case "SQLITE":
        await this.restoreSqlite(file);
        break;
      default:
        throw new InternalServerErrorException(
          "This server's DB_SYSTEM environment variable is set to an unknown value.",
        );
    }

    await this.connect();
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
        `pg_dump -w -F t -h ${configuration.DB.HOST} -p ${configuration.DB.PORT} -U ${configuration.DB.USERNAME} -d ${configuration.DB.DATABASE} -f ${backupFilePath}`,
        { env: { PGPASSWORD: configuration.DB.PASSWORD } },
      );

      return this.createStreamableFile(backupFilePath);
    } catch (error) {
      this.handleBackupError(error);
    }
  }

  private async backupSqlite(backupFilePath: string): Promise<StreamableFile> {
    this.logger.log({
      message: "Backing up SQLite Database...",
      backupFilePath,
    });
    await copyFile(
      `${configuration.VOLUMES.SQLITEDB}/database.sqlite`,
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
        `dropdb --if-exists -f -w -h ${configuration.DB.HOST} -p ${configuration.DB.PORT} -U ${configuration.DB.USERNAME} ${configuration.DB.DATABASE}`,
        { env: { PGPASSWORD: configuration.DB.PASSWORD } },
      );

      await this.execPromise(
        `createdb -w -h ${configuration.DB.HOST} -p ${configuration.DB.PORT} -U ${configuration.DB.USERNAME} ${configuration.DB.DATABASE}`,
        { env: { PGPASSWORD: configuration.DB.PASSWORD } },
      );

      try {
        await this.execPromise(
          `pg_restore -O -w -F t -h ${configuration.DB.HOST} -p ${configuration.DB.PORT} -U ${configuration.DB.USERNAME} -d ${configuration.DB.DATABASE} /tmp/gamevault_database_restore.db`,
          { env: { PGPASSWORD: configuration.DB.PASSWORD } },
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

      if (existsSync("/tmp/gamevault_database_pre_restore.db")) {
        this.logger.log("Restoring pre-restore database.");
        try {
          await this.execPromise(
            `dropdb --if-exists -f -w -h ${configuration.DB.HOST} -p ${configuration.DB.PORT} -U ${configuration.DB.USERNAME} ${configuration.DB.DATABASE}`,
            { env: { PGPASSWORD: configuration.DB.PASSWORD } },
          );

          await this.execPromise(
            `createdb -w -h ${configuration.DB.HOST} -p ${configuration.DB.PORT} -U ${configuration.DB.USERNAME} ${configuration.DB.DATABASE}`,
            { env: { PGPASSWORD: configuration.DB.PASSWORD } },
          );

          await this.execPromise(
            `pg_restore -O -w -F t -h ${configuration.DB.HOST} -p ${configuration.DB.PORT} -U ${configuration.DB.USERNAME} -d ${configuration.DB.DATABASE} /tmp/gamevault_database_pre_restore.db`,
            { env: { PGPASSWORD: configuration.DB.PASSWORD } },
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
      if (existsSync(`${configuration.VOLUMES.SQLITEDB}/database.sqlite`)) {
        this.backupSqlite("/tmp/gamevault_database_pre_restore.db");
      }
      await writeFile(
        `${configuration.VOLUMES.SQLITEDB}/database.sqlite`,
        file.buffer,
      );
    } catch (error) {
      this.logger.error({ message: "Error restoring SQLITE database", error });
      if (existsSync("/tmp/gamevault_database_pre_restore.db")) {
        this.logger.log("Restoring pre-restore database.");
        await copyFile(
          "/tmp/gamevault_database_pre_restore.db",
          `${configuration.VOLUMES.SQLITEDB}/database.sqlite`,
        );
        this.logger.log("Restored pre-restore database.");
      }
    }
  }

  private validatePassword(password: string) {
    if (configuration.DB.PASSWORD !== password) {
      throw new UnauthorizedException(
        "The database password provided in the X-Database-Password Header is incorrect.",
      );
    }
  }

  private generateBackupFilepath(): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-");
    return `/tmp/gamevault_${configuration.SERVER.VERSION}_database_backup_${timestamp}.db`;
  }

  private createStreamableFile(filePath: string): StreamableFile {
    const file = createReadStream(filePath);
    const length = statSync(filePath).size;
    const type = mime.getType(filePath);
    const filename = filenameSanitizer(unidecode(path.basename(filePath)));

    return new StreamableFile(file, {
      disposition: `attachment; filename="${filename}"`,
      length,
      type,
    });
  }

  private handleBackupError(error: unknown) {
    this.logger.error({ message: "Error backing up database", error });
    throw new InternalServerErrorException("Error backing up database.", {
      cause: error,
    });
  }
}
