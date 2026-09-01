import { type ConfigService } from "@nestjs/config";
import { AppConfiguration, CONFIG_NAMESPACE } from "./configuration.js";

export const GAMEVAULT_CONFIG = Symbol("GAMEVAULT_CONFIG");

export function getGamevaultConfig(
  configService: ConfigService,
): AppConfiguration {
  return configService.getOrThrow<AppConfiguration>(CONFIG_NAMESPACE);
}
