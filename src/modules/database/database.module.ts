import { DatabaseService } from "./database.service";
import { DatabaseController } from "./database.controller";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { getDatabaseConfiguration } from "./db_configuration";
import configuration from "../../configuration";

@Module({
  imports: [
    TypeOrmModule.forRoot(getDatabaseConfiguration(configuration.DB.SYSTEM)),
  ],
  controllers: [DatabaseController],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
