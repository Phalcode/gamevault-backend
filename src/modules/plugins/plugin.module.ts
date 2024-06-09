import { Module } from "@nestjs/common";

import { AdminModule } from "../admin/admin.module";
import { DatabaseModule } from "../database/database.module";
import { GamesModule } from "../games/games.module";
import { GarbageCollectionModule } from "../garbage-collection/garbage-collection.module";
import { HealthModule } from "../health/health.module";
import { MediaModule } from "../media/media.module";
import { MetadataModule } from "../metadata/metadata.module";
import { ProgressModule } from "../progresses/progress.module";
import { UsersModule } from "../users/users.module";
import { PluginService } from "./plugin.service";

@Module({
  providers: [PluginService],
  exports: [PluginService],
  imports: [
    GarbageCollectionModule,
    AdminModule,
    DatabaseModule,
    UsersModule,
    MediaModule,
    ProgressModule,
    HealthModule,
    GamesModule,
    MetadataModule,
  ],
})
export class PluginModule {}
