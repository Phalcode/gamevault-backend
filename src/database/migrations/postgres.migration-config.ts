import { DataSource } from "typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

export const dataSource = new DataSource({
  name: "postgres",
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "gamevault",
  password: "gamevault",
  database: "gamevault",
  entities: ["dist/database/entities/*.js"],
  migrations: ["dist/database/migrations/postgres/*.js"],
  namingStrategy: new SnakeNamingStrategy(),
});
