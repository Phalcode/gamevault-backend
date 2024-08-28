import { DataSource } from "typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

export const dataSource = new DataSource({
  name: "sqlite",
  type: "better-sqlite3",
  database: "../../../.local/db/database.sqlite",
  entities: ["dist/**/*.*entity.js"],
  migrations: ["dist/src/modules/database/migrations/sqlite/*.js"],
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: false,
});
