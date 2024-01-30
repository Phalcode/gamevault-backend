import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import axios from "axios";
import * as vm from "vm";
import configuration from "../../configuration";
import path from "path";

@Injectable()
export class PluginService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PluginService.name);
  public loadedPlugins = [];

  onApplicationBootstrap() {
    if (!configuration.PLUGIN.ENABLED) {
      return;
    }
    this.logger.warn(
      "Plugin Loader Activated",
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
          logger: new Logger(filename),
          fetch,
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
