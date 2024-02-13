import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import axios from "axios";
import * as vm from "vm";
import configuration from "../../configuration";
import path from "path";
import { BoxArtsService } from "../boxarts/boxarts.service";
import { DatabaseService } from "../database/database.service";
import { DevelopersService } from "../developers/developers.service";
import { FilesService } from "../files/files.service";
import { GamesService } from "../games/games.service";
import { ImageGarbageCollectionService } from "../garbage-collection/image-garbage-collection.service";
import { GenresService } from "../genres/genres.service";
import { HealthService } from "../health/health.service";
import { ImagesService } from "../images/images.service";
import { ProgressService } from "../progress/progress.service";
import { RawgService } from "../providers/rawg/rawg.service";
import { PublishersService } from "../publishers/publishers.service";
import { StoresService } from "../stores/stores.service";
import { TagsService } from "../tags/tags.service";
import { UsersService } from "../users/users.service";

@Injectable()
export class PluginService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PluginService.name);
  public loadedPlugins = [];

  constructor(
    private boxartService: BoxArtsService,
    private databaseService: DatabaseService,
    private developersService: DevelopersService,
    private filesService: FilesService,
    private gamesService: GamesService,
    private imageGarbageCollectionService: ImageGarbageCollectionService,
    private genresService: GenresService,
    private healthService: HealthService,
    private imagesService: ImagesService,
    private progressService: ProgressService,
    private rawgService: RawgService,
    private publishersService: PublishersService,
    private storesService: StoresService,
    private tagsService: TagsService,
    private usersService: UsersService,
  ) {}

  onApplicationBootstrap() {
    if (!configuration.PLUGIN.ENABLED) {
      return;
    }
    // TODO: Fully work out experimental plugin loader
    this.logger.warn(
      "Experimental Plugin Loader Activated",
      `${configuration.PLUGIN.SOURCES.length} plugin(s) discovered`,
      {
        sources: configuration.PLUGIN.SOURCES,
      },
    );

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
          boxartService: this.boxartService,
          databaseService: this.databaseService,
          developersService: this.developersService,
          filesService: this.filesService,
          gamesService: this.gamesService,
          imageGarbageCollectionService: this.imageGarbageCollectionService,
          genresService: this.genresService,
          healthService: this.healthService,
          pluginService: this,
          imagesService: this.imagesService,
          progressService: this.progressService,
          rawgService: this.rawgService,
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
        this.logger.error({ source, error }, "Error loading plugin");
      }
    }

    if (this.loadedPlugins.length) {
      const loadedPluginMetas = this.loadedPlugins.map((plugin) => plugin.meta);
      this.logger.log(`${this.loadedPlugins.length} plugin(s) loaded.`, {
        plugins: loadedPluginMetas,
      });
    }
  }
}
