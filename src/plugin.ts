import fsExtra from "fs-extra";
import path, { join, resolve } from "path";
import configuration from "./configuration.js";
import { type GameVaultPluginModule } from "./globals.js";
import { default as logger } from "./logging.js";
const { copy, mkdir, readdir } = fsExtra;

export default async function loadPlugins() {
  try {
    const pluginDir = configuration.VOLUMES.PLUGINS;
    let injectDir: string;

    if (configuration.VOLUMES.PLUGINS == "./.local/plugins") {
      // In Development
      injectDir = path.resolve(import.meta.dirname, "..", pluginDir);
      logger.log({
        context: "PluginLoader",
        message: "Short-Circuiting Plugins.",
        pluginDir,
        injectDir,
      });
    } else {
      // In Production
      injectDir = path.resolve(`dist/src/modules`);
      logger.log({
        context: "PluginLoader",
        message: "Injecting Plugins.",
        pluginDir,
        injectDir,
      });
      await copy(pluginDir, injectDir);
    }

    await mkdir(injectDir, { recursive: true });

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
        (file) => import(resolve(join(file.parentPath, file.name))),
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
