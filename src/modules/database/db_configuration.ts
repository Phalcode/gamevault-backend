import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { readFileSync } from "fs";
import pg from "pg";
import { TlsOptions } from "tls";
import { BetterSqlite3ConnectionOptions } from "typeorm/driver/better-sqlite3/BetterSqlite3ConnectionOptions";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

import configuration from "../../configuration";

const baseConfig: TypeOrmModuleOptions = {
  autoLoadEntities: true,
  entities: ["dist/**/*.entity.js"],
  synchronize: configuration.DB.SYNCHRONIZE,
  cache: { alwaysEnabled: true, ignoreErrors: true },
  namingStrategy: new SnakeNamingStrategy(),
  migrationsRun: !configuration.DB.SYNCHRONIZE,
  logging: configuration.DB.DEBUG,
};

const postgresConfig: PostgresConnectionOptions = {
  type: "postgres",
  host: configuration.DB.HOST,
  port: configuration.DB.PORT,
  username: configuration.DB.USERNAME,
  password: configuration.DB.PASSWORD,
  database: configuration.DB.DATABASE,
  migrations: ["dist/src/modules/database/migrations/postgres/*.js"],
  ssl: getPostgresTlsOptions(),
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
  switch (databaseType) {
    case "SQLITE":
      return { ...baseConfig, ...sqliteConfig } as TypeOrmModuleOptions;
    case "POSTGRESQL":
    default:
      preparePostgresConnector();
      return { ...baseConfig, ...postgresConfig } as TypeOrmModuleOptions;
  }
}

function preparePostgresConnector() {
  /**
   * @see https://github.com/brianc/node-postgres/issues/2141
   * Other links that can be helpful:
   *  - https://github.com/typeorm/typeorm/issues/4519
   *  - https://github.com/brianc/node-postgres/issues/1746
   *  - https://github.com/typeorm/typeorm/issues/2390
   */
  pg.defaults.parseInputDatesAsUTC = true;
}

function getPostgresTlsOptions(): TlsOptions {
  if (!configuration.DB.SSL.ENABLED) {
    return undefined;
  }
  return {
    rejectUnauthorized: configuration.DB.SSL.REJECT_UNAUTHORIZED_ENABLED,
    ca: configuration.DB.SSL.CA_CERT_PATH
      ? readFileSync(configuration.DB.SSL.CA_CERT_PATH).toString()
      : undefined,
    key: configuration.DB.SSL.KEY_PATH
      ? readFileSync(configuration.DB.SSL.KEY_PATH)
      : undefined,
    cert: configuration.DB.SSL.CERT_PATH
      ? readFileSync(configuration.DB.SSL.CERT_PATH)
      : undefined,
  };
}
