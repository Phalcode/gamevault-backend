import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
import { BetterSqlite3ConnectionOptions } from "typeorm/driver/better-sqlite3/BetterSqlite3ConnectionOptions";
import configuration from "../../configuration";
import pg from "pg";
import logger from "../../logging";

const baseConfig: TypeOrmModuleOptions = {
  autoLoadEntities: true,
  entities: ["dist/**/*.entity.js"],
  synchronize: configuration.DB.SYNCHRONIZE,
  cache: true,
  namingStrategy: new SnakeNamingStrategy(),
  migrationsRun: !configuration.DB.SYNCHRONIZE,
  logging: configuration.DB.DEBUG,
  useUTC: true,
};

const postgresConfig: PostgresConnectionOptions = {
  type: "postgres",
  host: configuration.DB.HOST,
  port: configuration.DB.PORT,
  username: configuration.DB.USERNAME,
  password: configuration.DB.PASSWORD,
  database: configuration.DB.DATABASE,
  migrations: ["dist/src/modules/database/migrations/postgres/*.js"],
};

const sqliteConfig: BetterSqlite3ConnectionOptions = {
  type: "better-sqlite3",
  migrations: ["dist/src/modules/database/migrations/sqlite/*.js"],
  database: configuration.TESTING.IN_MEMORY_DB
    ? ":memory:"
    : `${configuration.VOLUMES.SQLITEDB}/database.sqlite`,
};

export function getDatabaseConfiguration(
  databaseType: string,
): TypeOrmModuleOptions {
  if (databaseType === "SQLITE") {
    return { ...baseConfig, ...sqliteConfig } as TypeOrmModuleOptions;
  } else {
    preparePostgresConnector();
    return { ...baseConfig, ...postgresConfig } as TypeOrmModuleOptions;
  }
}

function preparePostgresConnector() {
  logger.debug("Initialed PostgreSQL type-parser...");
  // workaround for https://github.com/typeorm/typeorm/issues/2622
  pg.types.setTypeParser(1114, (stringValue: string) => {
    const converted = new Date(`${stringValue}+0000`);
    logger.debug("converted datetime: " + stringValue + " to " + converted);
    return converted;
  });
}
