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

    this.validateDatabasePassword(password);
    await this.disconnectDatabase();

    let backupFile: Promise<StreamableFile>;

    switch (configuration.DB.SYSTEM) {
      case "POSTGRESQL":
        backupFile = this.backupPostgresqlDatabase(
          this.generateBackupFilepath(),
        );
        break;
      case "SQLITE":
        backupFile = this.backupSqliteDatabase(this.generateBackupFilepath());
        break;
      default:
        throw new InternalServerErrorException(
          "This server's DB_SYSTEM environment variable is set to an unknown value.",
        );
    }

    await this.connectDatabase();
    return backupFile;
  }

  async restore(file: Express.Multer.File, password: string) {
    if (configuration.TESTING.IN_MEMORY_DB) {
      throw new NotAcceptableException(
        "This server can't restore backups as it uses an in-memory database.",
      );
    }

    this.validateDatabasePassword(password);
    await this.disconnectDatabase();

    switch (configuration.DB.SYSTEM) {
      case "POSTGRESQL":
        await this.restorePostgresqlDatabase(file);
        break;
      case "SQLITE":
        await this.restoreSqliteDatabase(file);
        break;
      default:
        throw new InternalServerErrorException(
          "This server's DB_SYSTEM environment variable is set to an unknown value.",
        );
    }

    await this.connectDatabase();
    await this.migrateDatabase();
  }

  async connectDatabase() {
    this.logger.log("Connecting Database...");
    return await this.dataSource.initialize();
  }

  async disconnectDatabase() {
    this.logger.log("Disconnecting Database...");
    return await this.dataSource.destroy();
  }

  async migrateDatabase() {
    this.logger.log("Migrating Database...");
    return await this.dataSource.runMigrations();
  }

  async backupPostgresqlDatabase(
    backupFilePath: string,
  ): Promise<StreamableFile> {
    this.logger.log("Backing up PostgreSQL Database...");
    try {
      await this.execPromise(
        `pg_dump -w -F t -h ${configuration.DB.HOST} -p ${configuration.DB.PORT} -U ${configuration.DB.USERNAME} -d ${configuration.DB.DATABASE} -f ${backupFilePath}`,
        { env: { PGPASSWORD: configuration.DB.PASSWORD } },
      );

      return this.createStreamableFile(backupFilePath);
    } catch (error) {
      this.handleDatabaseBackupError(error);
    }
  }

  private async backupSqliteDatabase(
    backupFilePath: string,
  ): Promise<StreamableFile> {
    this.logger.log("Backing up SQLITE Database...");
    copyFileSync(
      `${configuration.VOLUMES.SQLITEDB}/database.sqlite`,
      backupFilePath,
    );

    return this.createStreamableFile(backupFilePath);
  }

  async restorePostgresqlDatabase(file: Express.Multer.File) {
    this.logger.log("Restoring PostgreSQL Database...");
    try {
      await this.backupPostgresqlDatabase(
        "/tmp/gamevault_database_pre_restore.db",
      );

      writeFileSync("/tmp/gamevault_database_restore.db", file.buffer);

      try {
        await this.execPromise(
          `pg_restore -O -c --if-exists -w -F t -h ${configuration.DB.HOST} -p ${configuration.DB.PORT} -U ${configuration.DB.USERNAME} -d ${configuration.DB.DATABASE} /tmp/gamevault_database_restore.db`,
          { env: { PGPASSWORD: configuration.DB.PASSWORD } },
        );

        this.logger.log("Successfully restored PostgreSQL Database...");
      } catch (error) {
        this.logger.warn(
          error,
          "Something may went wrong restoring your backup. Please check the logs carefully",
        );
      }
    } catch (error) {
      this.logger.error(error, "Error restoring PostgreSQL database.");

      if (existsSync("/tmp/gamevault_database_pre_restore.db")) {
        this.logger.log("Restoring pre-restore database.");
        try {
          await this.execPromise(
            `pg_restore -O -c --if-exists -w -F t -h ${configuration.DB.HOST} -p ${configuration.DB.PORT} -U ${configuration.DB.USERNAME} -d ${configuration.DB.DATABASE} /tmp/gamevault_database_pre_restore.db`,
            { env: { PGPASSWORD: configuration.DB.PASSWORD } },
          );
          this.logger.log("Restored pre-restore database.");
        } catch (error) {
          this.logger.error(
            error,
            "Error restoring pre-restore PostgreSQL database. Please restore the dump manually.",
          );
          throw new InternalServerErrorException(
            "Error restoring pre-restore PostgreSQL Database.",
          );
        }
      }
    }
  }

  private async restoreSqliteDatabase(file: Express.Multer.File) {
    this.logger.log("Restoring SQLITE Database...");
    try {
      if (existsSync(`${configuration.VOLUMES.SQLITEDB}/database.sqlite`)) {
        this.backupSqliteDatabase("/tmp/gamevault_database_pre_restore.db");
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

  private validateDatabasePassword(password: string) {
    if (configuration.DB.PASSWORD !== password) {
      throw new UnauthorizedException(
        "The database password provided in the X-Database-Password Header is incorrect.",
      );
    }
  }

  private generateBackupFilepath(): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-");
    return `/tmp/gamevault_database_backup_${timestamp}.db`;
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

  private handleDatabaseBackupError(error: unknown) {
    this.logger.error(error, "Error backing up database");
    throw new InternalServerErrorException("Error backing up database.");
  }
}
