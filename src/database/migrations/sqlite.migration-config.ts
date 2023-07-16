import { DataSource } from "typeorm";

export const dataSource = new DataSource({
  name: "sqlite",
  type: "better-sqlite3",
  database: "./migrations-database.sqlite",
  entities: ["dist/database/entities/*.js"],
  migrations: ["dist/database/migrations/bettersqlite3/*.js"],
});
