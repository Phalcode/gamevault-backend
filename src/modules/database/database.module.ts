import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import {
  type AppConfiguration,
  CONFIG_NAMESPACE,
} from "../../configuration.js";
import { DatabaseService } from "./database.service.js";
import { getDatabaseConfiguration } from "./db_configuration.js";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const configuration =
          configService.getOrThrow<AppConfiguration>(CONFIG_NAMESPACE);
        return getDatabaseConfiguration(configuration);
      },
    }),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
