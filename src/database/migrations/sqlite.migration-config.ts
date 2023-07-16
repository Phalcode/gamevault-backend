import { DataSource } from "typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

export const dataSource = new DataSource({
  name: "sqlite",
  type: "better-sqlite3",
  database: "database.sqlite",
  entities: ["dist/database/entities/*.js"],
  migrations: ["dist/database/migrations/bettersqlite3/*.js"],
  namingStrategy: new SnakeNamingStrategy(),
});
