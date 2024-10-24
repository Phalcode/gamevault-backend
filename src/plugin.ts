import { cp, readdir, rm } from "fs/promises";
import { join, resolve } from "path";
import configuration from "./configuration";
import { GameVaultPluginModule } from "./globals";
import { default as logger } from "./logging";

export default async function loadPlugins() {
  const injectDir = `${__dirname}/../plugins/injected`;

  // Step 1: Remove /app/dist/plugins/injected folder if it exists
  try {
    await rm(injectDir, { recursive: true, force: true });
    logger.debug({
      context: "PluginLoader",
      message: "Ejecting plugins.",
    });
  } catch (error) {
    logger.error({
      context: "PluginLoader",
      message: "Failed to eject plugins folder.",
      error,
    });
  }

  // Step 2: Copy configuration.VOLUMES.PLUGINS folder to /app/dist/plugins/injected
  try {
    await cp(configuration.VOLUMES.PLUGINS, injectDir, { recursive: true });
    logger.log({
      context: "PluginLoader",
      message: "Injecting plugins.",
    });
  } catch (error) {
    logger.error({
      context: "PluginLoader",
      message: "Failed to inject plugins folder.",
      error,
    });
    throw error;
  }

  // Step 3: Load the plugin files from the new /app/dist/plugins/injected folder
  const pluginModuleFiles = (
    await readdir(injectDir, {
      encoding: "utf8",
      recursive: true,
      withFileTypes: true,
    })
  ).filter((file) => file.isFile() && file.name.endsWith(".plugin.module.js"));

  const plugins = await Promise.all(
    pluginModuleFiles.map(
      (file) => import(resolve(join(file.path, file.name))),
    ),
  );

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
}
