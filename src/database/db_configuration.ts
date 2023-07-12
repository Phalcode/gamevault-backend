import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import configuration from "../configuration";

const baseConfig: TypeOrmModuleOptions = {
  entities: ["dist/database/entities/*.entity{.ts,.js}"],
  migrations: ["dist/database/migrations/*.migration{.ts,.js}"],
  synchronize: configuration.DB.SYNCHRONIZE,
  cache: true,
  namingStrategy: new SnakeNamingStrategy(),
  migrationsRun: !configuration.DB.SYNCHRONIZE,
  logging: configuration.DB.DEBUG,
};

const postgresConfig: TypeOrmModuleOptions = {
  type: "postgres",
  host: configuration.DB.HOST,
  port: configuration.DB.PORT,
  username: configuration.DB.USERNAME,
  password: configuration.DB.PASSWORD,
  database: configuration.DB.DATABASE,
};

const sqliteConfig: TypeOrmModuleOptions = {
  type: "better-sqlite3",
  database: configuration.TESTING.IN_MEMORY_DB
    ? ":memory:"
    : `${configuration.VOLUMES.SQLITEDB}/crackpipe_db.sqlite`,
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
