import { cp, readdir } from "fs/promises";
import path, { join, resolve } from "path";
import configuration from "./configuration";
import { GameVaultPluginModule } from "./globals";
import { default as logger } from "./logging";

export default async function loadPlugins() {
  try {
    const pluginDir = configuration.VOLUMES.PLUGINS;
    let injectDir = "/tmp";

    if (configuration.VOLUMES.PLUGINS == "./.local/plugins") {
      // In Development
      logger.log({
        context: "PluginLoader",
        message: "Short-Circuiting Plugins.",
        pluginDir,
        injectDir,
      });
      injectDir = path.resolve(__dirname, "..", pluginDir);
    } else {
      injectDir = path.resolve(`dist/src/modules`);
      // In Production
      logger.log({
        context: "PluginLoader",
        message: "Injecting Plugins.",
        pluginDir,
        injectDir,
      });
      await cp(pluginDir, injectDir, { recursive: true });
    }

    const pluginModuleFiles = (
      await readdir(injectDir, {
        encoding: "utf8",
        recursive: true,
        withFileTypes: true,
      })
    ).filter(
      (file) => file.isFile() && file.name.endsWith(".plugin.module.js"),
    );

    const plugins = await Promise.all(
      pluginModuleFiles.map(
        (file) => import(resolve(join(file.path, file.name))),
      ),
    );

    logger.log({
      context: "PluginLoader",
      message: `Found ${pluginModuleFiles.length} plugins to load.`,
    });

    for (const plugin of plugins) {
      const instance: GameVaultPluginModule = new plugin.default();
      logger.log({
        context: "PluginLoader",
        message: `Loaded plugin.`,
        plugin: plugin.default,
        metadata: instance.metadata,
      });
    }

    const pluginModules = plugins.map((module) => module.default);

    logger.log({
      context: "PluginLoader",
      message: `Loaded ${plugins.length} plugins.`,
      plugins: pluginModules,
    });

    return pluginModules;
  } catch (error) {
    logger.error({ message: "Error loading plugins.", error });
    return [];
  }
}
