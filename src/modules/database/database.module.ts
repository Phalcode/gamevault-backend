import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import configuration from "../../configuration";
import { DatabaseService } from "./database.service";
import { getDatabaseConfiguration } from "./db_configuration";

@Module({
  imports: [
    TypeOrmModule.forRoot(getDatabaseConfiguration(configuration.DB.SYSTEM)),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
