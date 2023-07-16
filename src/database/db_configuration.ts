import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import configuration from "../configuration";
import { DataSource, DataSourceOptions } from "typeorm";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";
import { BetterSqlite3ConnectionOptions } from "typeorm/driver/better-sqlite3/BetterSqlite3ConnectionOptions";

const baseConfig: TypeOrmModuleOptions = {
  entities: ["dist/database/entities/*.js"],
  migrations: ["dist/database/migrations/*.js"],
  synchronize: configuration.DB.SYNCHRONIZE,
  cache: true,
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
};

const sqliteConfig: BetterSqlite3ConnectionOptions = {
  type: "better-sqlite3",
  database: configuration.TESTING.IN_MEMORY_DB
    ? ":memory:"
    : `${configuration.VOLUMES.SQLITEDB}/database.sqlite`,
};

export function getDatabaseConfiguration(): TypeOrmModuleOptions {
  switch (configuration.DB.SYSTEM) {
    case "SQLITE":
      return { ...baseConfig, ...sqliteConfig } as TypeOrmModuleOptions;
    case "POSTGRESQL":
      return { ...baseConfig, ...postgresConfig } as TypeOrmModuleOptions;
    default:
      return { ...baseConfig, ...postgresConfig } as TypeOrmModuleOptions;
  }
}

// This is used for typeorm-generated migrations
export const dataSource = new DataSource({
  type: "better-sqlite3",
  database: `./migrations-database.sqlite`,
  entities: ["dist/database/entities/*.js"],
  migrations: ["dist/database/migrations/*.js"],
  namingStrategy: new SnakeNamingStrategy(),
} as DataSourceOptions);
