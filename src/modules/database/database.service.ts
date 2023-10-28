import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotAcceptableException,
  StreamableFile,
  UnauthorizedException,
} from "@nestjs/common";
import configuration from "../../configuration";
import {
  copyFileSync,
  createReadStream,
  existsSync,
  statSync,
  writeFileSync,
} from "fs";
import { DataSource } from "typeorm";
import unidecode from "unidecode";
import filenameSanitizer from "sanitize-filename";
import mime from "mime";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);
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
    return await this.dataSource.initialize();
  }

  async disconnect() {
    this.logger.log("Disconnecting Database...");
    return await this.dataSource.destroy();
  }

  async migrate() {
    this.logger.log("Migrating Database...");
    return await this.dataSource.runMigrations();
  }

  async backupPostgresql(backupFilePath: string): Promise<StreamableFile> {
    this.logger.log("Backing up PostgreSQL Database...");
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
    this.logger.log("Backing up SQLITE Database...");
    copyFileSync(
      `${configuration.VOLUMES.SQLITEDB}/database.sqlite`,
      backupFilePath,
    );

    return this.createStreamableFile(backupFilePath);
  }

  async restorePostgresql(file: Express.Multer.File) {
    this.logger.log("Restoring PostgreSQL Database...");
    try {
      await this.backupPostgresql("/tmp/gamevault_database_pre_restore.db");

      writeFileSync("/tmp/gamevault_database_restore.db", file.buffer);

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
        this.logger.warn(
          error,
          "Restoring your backup might have encountered an issue. Please examine the logs. If it reads 'pg_restore: warning: errors ignored on restore,' things are likely alright. It could have succeeded.",
        );
      }
    } catch (error) {
      this.logger.error(error, "Error restoring PostgreSQL database.");

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
          this.logger.error(
            error,
            "Errors occured restoring pre-restore PostgreSQL database. Please restore the backup manually.",
          );
          throw new InternalServerErrorException(
            "Error restoring pre-restore PostgreSQL Database.",
          );
        }
      }
    }
  }

  private async restoreSqlite(file: Express.Multer.File) {
    this.logger.log("Restoring SQLITE Database...");
    try {
      if (existsSync(`${configuration.VOLUMES.SQLITEDB}/database.sqlite`)) {
        this.backupSqlite("/tmp/gamevault_database_pre_restore.db");
      }
      writeFileSync(
        `${configuration.VOLUMES.SQLITEDB}/database.sqlite`,
        file.buffer,
      );
    } catch (error) {
      this.logger.error(error, "Error restoring SQLITE database");
      if (existsSync("/tmp/gamevault_database_pre_restore.db")) {
        this.logger.log("Restoring pre-restore database.");
        copyFileSync(
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
    this.logger.error(error, "Error backing up database");
    throw new InternalServerErrorException("Error backing up database.");
  }
}
