import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import axios from "axios";
import path from "path";
import * as vm from "vm";

import configuration from "../../configuration";
import { DatabaseService } from "../database/database.service";
import { FilesService } from "../games/files.service";
import { GamesService } from "../games/games.service";
import { MediaGarbageCollectionService } from "../garbage-collection/media-garbage-collection.service";
import { HealthService } from "../health/health.service";
import { MediaService } from "../media/media.service";
import { DeveloperMetadataService } from "../metadata/services/data/developers-metadata.service";
import { GenreMetadataService } from "../metadata/services/data/genre-metadata.service";
import { PublisherMetadataService } from "../metadata/services/data/publisher-metadata.service";
import { StoreMetadataService } from "../metadata/services/data/store-metadata.service";
import { TagMetadataService } from "../metadata/services/data/tag-metadata.service";
import { ProgressService } from "../progresses/progress.service";
import { UsersService } from "../users/users.service";

@Injectable()
export class PluginService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PluginService.name);
  public loadedPlugins = [];

  constructor(
    private databaseService: DatabaseService,
    private developersService: DeveloperMetadataService,
    private filesService: FilesService,
    private gamesService: GamesService,
    private mediaGarbageCollectionService: MediaGarbageCollectionService,
    private genresService: GenreMetadataService,
    private healthService: HealthService,
    private mediaService: MediaService,
    private progressService: ProgressService,
    private publishersService: PublisherMetadataService,
    private storesService: StoreMetadataService,
    private tagsService: TagMetadataService,
    private usersService: UsersService,
  ) {}

  onApplicationBootstrap() {
    if (!configuration.PLUGIN.ENABLED) {
      return;
    }
    // TODO: Fully work out experimental plugin loader
    this.logger.warn({
      message: `Experimental Plugin Loader Activated: ${configuration.PLUGIN.SOURCES.length} plugin(s) discovered.`,
      reason: "PLUGIN_ENABLED is set to true.",
      sources: configuration.PLUGIN.SOURCES,
    });

    this.loadPlugins();
  }

  private async loadPlugins(): Promise<void> {
    for (const source of configuration.PLUGIN.SOURCES) {
      try {
        const response = await axios.get(source);
        const filename = path.basename(source);
        const pluginContext = {
          module: { exports: { meta: {} } },
          fetch,
          logger: new Logger(filename),
          configuration: process.env,
          databaseService: this.databaseService,
          developersService: this.developersService,
          filesService: this.filesService,
          mediaGarbageCollectionService: this.mediaGarbageCollectionService,
          genresService: this.genresService,
          healthService: this.healthService,
          pluginService: this,
          mediaService: this.mediaService,
          gamesService: this.gamesService,
          progressService: this.progressService,
          publishersService: this.publishersService,
          storesService: this.storesService,
          tagsService: this.tagsService,
          usersService: this.usersService,
        };
        vm.createContext(pluginContext);
        const script = new vm.Script(response.data, { filename });
        script.runInContext(pluginContext);
        this.loadedPlugins.push(pluginContext.module.exports);
      } catch (error) {
        this.logger.error({ message: "Error loading plugin.", error, source });
      }
    }

    if (this.loadedPlugins.length) {
      const loadedPluginMetas = this.loadedPlugins.map((plugin) => plugin.meta);
      this.logger.log({
        message: `Successfully loaded ${this.loadedPlugins.length} Plugin(s).`,
        plugins: loadedPluginMetas,
      });
    }
  }
}
