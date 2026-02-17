import { registerAs } from "@nestjs/config";
import bytes from "bytes";
import { createHash, randomBytes } from "crypto";
import * as dotenv from "dotenv";
import { existsSync } from "fs";
import { readFileSync } from "fs-extra";
import { toLower } from "lodash";
import { join } from "path";
import { parse as parseYaml } from "yaml";
import packageJson from "../package.json";
import globals from "./globals";

dotenv.config();

let yamlConfigurationCache: Record<string, unknown> | null | undefined;

function getConfigVolumePath(): string {
  return process.env.VOLUMES_CONFIG?.replace(/\/$/, "") || "/config";
}

function getYamlConfiguration(): Record<string, unknown> | null {
  if (yamlConfigurationCache !== undefined) {
    return yamlConfigurationCache;
  }

  const configVolumePath = getConfigVolumePath();
  const candidates = ["config.yaml", "config.yml"];

  for (const candidate of candidates) {
    const yamlPath = join(configVolumePath, candidate);
    if (!existsSync(yamlPath)) {
      continue;
    }

    try {
      const parsed = parseYaml(readFileSync(yamlPath, "utf-8"));
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        yamlConfigurationCache = parsed as Record<string, unknown>;
        return yamlConfigurationCache;
      }

      throw new Error("Configuration root must be a YAML mapping/object.");
    } catch (error) {
      throw new Error(
        `Failed to parse YAML configuration at \"${yamlPath}\": ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  yamlConfigurationCache = null;
  return yamlConfigurationCache;
}

function getYamlValueByPath(
  source: Record<string, unknown>,
  pathSegments: string[],
): unknown {
  let current: unknown = source;

  for (const segment of pathSegments) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }

    const record = current as Record<string, unknown>;
    const matchedKey = Object.keys(record).find(
      (key) => key.toLowerCase() === segment.toLowerCase(),
    );

    if (!matchedKey) {
      return undefined;
    }

    current = record[matchedKey];
  }

  return current;
}

function toEnvironmentString(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value.map(String).join(",");
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  return JSON.stringify(value);
}

function resolveYamlEnvFallback(name: string): string | undefined {
  const yamlConfiguration = getYamlConfiguration();
  if (!yamlConfiguration) {
    return undefined;
  }

  const directValue = getYamlValueByPath(yamlConfiguration, [name]);
  if (directValue !== undefined) {
    return toEnvironmentString(directValue);
  }

  const nestedValue = getYamlValueByPath(yamlConfiguration, name.split("_"));
  return toEnvironmentString(nestedValue);
}

/**
 * Resolves an environment variable with Docker Secrets support.
 * If `<name>_FILE` is set, reads the file at that path and returns its
 * trimmed contents. Otherwise returns the value of `<name>` directly.
 * This allows sensitive values (passwords, API keys, etc.) to be provided
 * via Docker Secrets without changing the existing configuration structure.
 */
function resolveEnv(name: string): string | undefined {
  const filePath = process.env[`${name}_FILE`];
  if (filePath) {
    try {
      return readFileSync(filePath, "utf-8").trim();
    } catch (error) {
      throw new Error(
        `Failed to read Docker secret from ${name}_FILE="${filePath}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  if (process.env[name] !== undefined) {
    return process.env[name];
  }

  return resolveYamlEnvFallback(name);
}

function parseBooleanEnvVariable(
  environmentVariable: string,
  defaultCase: boolean = false,
): boolean {
  switch (toLower(environmentVariable)) {
    case "0":
    case "false":
    case "no":
    case "off":
    case "disable":
    case "disabled":
      return false;
    case "1":
    case "true":
    case "yes":
    case "on":
    case "enable":
    case "enabled":
      return true;
    default:
      return defaultCase;
  }
}

function parsePath(environmentVariable: string, defaultPath: string) {
  return environmentVariable?.replace(/\/$/, "") || defaultPath;
}

function parseList(
  environmentVariable: string,
  defaultList: string[] = [],
): string[] {
  return environmentVariable
    ? environmentVariable.split(",").map((item) => item.trim())
    : defaultList;
}

function parseNumber(
  environmentVariable: string,
  defaultValue?: number,
): number | undefined {
  const number = Number(environmentVariable);
  if (isNaN(number) || number < 0 || number > Number.MAX_SAFE_INTEGER) {
    return defaultValue ?? undefined;
  }
  return number;
}

function parseKibibytesToBytes(
  environmentVariable: string,
  defaultValue?: number,
): number | undefined {
  const bytes = Number(environmentVariable) * 1024;
  if (isNaN(bytes) || bytes <= 0 || bytes > Number.MAX_SAFE_INTEGER) {
    return defaultValue ?? undefined;
  }
  return bytes;
}

function parseRegExp(
  environmentVariable: string,
  defaultValue?: RegExp,
): RegExp | undefined {
  return environmentVariable ? RegExp(environmentVariable) : defaultValue;
}

function safeHash(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  return createHash("sha256").update(value).digest("hex");
}

export function getMaxBodySizeInBytes() {
  return Math.max(
    bytes("10mb"),
    configuration.MEDIA.MAX_SIZE,
    configuration.SAVEFILES.MAX_SIZE,
    configuration.GAMES.MAX_UPLOAD_SIZE,
  );
}

const configuration = {
  SERVER: {
    PORT: parseNumber(resolveEnv("SERVER_PORT"), 8080),
    VERSION: process.env.npm_package_version || packageJson.version,
    DEMO_MODE_ENABLED: parseBooleanEnvVariable(
      resolveEnv("SERVER_DEMO_MODE_ENABLED"),
    ),
    LOG_LEVEL: toLower(resolveEnv("SERVER_LOG_LEVEL")) || "info",
    LOG_FILES_ENABLED: parseBooleanEnvVariable(
      resolveEnv("SERVER_LOG_FILES_ENABLED"),
      true,
    ),
    REQUEST_LOG_FORMAT:
      resolveEnv("SERVER_REQUEST_LOG_FORMAT") || globals.LOGGING_FORMAT,
    CORS_ALLOWED_ORIGINS: parseList(
      resolveEnv("SERVER_CORS_ALLOWED_ORIGINS"),
      [],
    ),
    REGISTRATION_DISABLED: parseBooleanEnvVariable(
      resolveEnv("SERVER_REGISTRATION_DISABLED"),
    ),
    ACCOUNT_ACTIVATION_DISABLED: parseBooleanEnvVariable(
      resolveEnv("SERVER_ACCOUNT_ACTIVATION_DISABLED"),
    ),
    ADMIN_USERNAME: resolveEnv("SERVER_ADMIN_USERNAME") || undefined,
    ADMIN_PASSWORD: resolveEnv("SERVER_ADMIN_PASSWORD") || undefined,
    MAX_DOWNLOAD_BANDWIDTH_IN_KBPS: parseKibibytesToBytes(
      resolveEnv("SERVER_MAX_DOWNLOAD_BANDWIDTH_IN_KBPS"),
    ),
    ONLINE_ACTIVITIES_DISABLED: parseBooleanEnvVariable(
      resolveEnv("SERVER_ONLINE_ACTIVITIES_DISABLED"),
    ),
    STACK_TRACE_LIMIT: parseNumber(resolveEnv("SERVER_STACK_TRACE_LIMIT"), 10),
    HTTPS: {
      ENABLED: parseBooleanEnvVariable(resolveEnv("SERVER_HTTPS_ENABLED")),
      PORT: parseNumber(resolveEnv("SERVER_HTTPS_PORT"), 8443),
      KEY_PATH: resolveEnv("SERVER_HTTPS_KEY_PATH") || undefined,
      CERT_PATH: resolveEnv("SERVER_HTTPS_CERT_PATH") || undefined,
      CA_CERT_PATH: resolveEnv("SERVER_HTTPS_CA_CERT_PATH") || undefined,
    } as const,
  } as const,
  WEB_UI: {
    ENABLED: parseBooleanEnvVariable(
      resolveEnv("WEB_UI_ENABLED") ||
        resolveEnv("SERVER_WEB_UI_ENABLED") ||
        resolveEnv("SERVER_LANDING_PAGE_ENABLED"),
      true,
    ),
    VERSION: resolveEnv("WEB_UI_VERSION") || undefined,
  } as const,
  VOLUMES: {
    CONFIG: parsePath(resolveEnv("VOLUMES_CONFIG"), "/config"),
    FILES: parsePath(resolveEnv("VOLUMES_FILES"), "/files"),
    MEDIA: parsePath(resolveEnv("VOLUMES_MEDIA"), "/media"),
    LOGS: parsePath(resolveEnv("VOLUMES_LOGS"), "/logs"),
    SQLITEDB: parsePath(resolveEnv("VOLUMES_SQLITEDB"), "/db"),
    PLUGINS: parsePath(resolveEnv("VOLUMES_PLUGINS"), "/plugins"),
    SAVEFILES: parsePath(resolveEnv("VOLUMES_SAVEFILES"), "/savefiles"),
  } as const,
  DB: {
    SYSTEM: resolveEnv("DB_SYSTEM") || "POSTGRESQL",
    HOST: resolveEnv("DB_HOST") || "localhost",
    PORT: parseNumber(resolveEnv("DB_PORT"), 5432),
    USERNAME: resolveEnv("DB_USERNAME") || "default",
    PASSWORD: resolveEnv("DB_PASSWORD") || "default",
    DATABASE: resolveEnv("DB_DATABASE") || "gamevault",
    DEBUG: parseBooleanEnvVariable(resolveEnv("DB_DEBUG")),
    SYNCHRONIZE: parseBooleanEnvVariable(resolveEnv("DB_SYNCHRONIZE")),
    TLS: {
      ENABLED: parseBooleanEnvVariable(resolveEnv("DB_TLS_ENABLED")),
      REJECT_UNAUTHORIZED_ENABLED: parseBooleanEnvVariable(
        resolveEnv("DB_TLS_REJECT_UNAUTHORIZED_ENABLED"),
      ),
      KEY_PATH: parsePath(resolveEnv("DB_TLS_KEY_PATH"), ""),
      CERTIFICATE_PATH: parsePath(resolveEnv("DB_TLS_CERTIFICATE_PATH"), ""),
      CA_CERTIFICATE_PATH: parsePath(
        resolveEnv("DB_TLS_CA_CERTIFICATE_PATH"),
        "",
      ),
    },
  } as const,
  USERS: {
    REQUIRE_EMAIL: parseBooleanEnvVariable(resolveEnv("USERS_REQUIRE_EMAIL")),
    REQUIRE_FIRST_NAME: parseBooleanEnvVariable(
      resolveEnv("USERS_REQUIRE_FIRST_NAME"),
    ),
    REQUIRE_LAST_NAME: parseBooleanEnvVariable(
      resolveEnv("USERS_REQUIRE_LAST_NAME"),
    ),
    REQUIRE_BIRTH_DATE: parseBooleanEnvVariable(
      resolveEnv("USERS_REQUIRE_BIRTH_DATE"),
    ),
  } as const,
  PARENTAL: {
    AGE_RESTRICTION_ENABLED: parseBooleanEnvVariable(
      resolveEnv("PARENTAL_AGE_RESTRICTION_ENABLED"),
    ),
    AGE_OF_MAJORITY: parseNumber(resolveEnv("PARENTAL_AGE_OF_MAJORITY"), 18),
  } as const,
  GAMES: {
    INDEX_USE_POLLING: parseBooleanEnvVariable(
      resolveEnv("GAMES_INDEX_USE_POLLING"),
    ),
    INDEX_INTERVAL_IN_MINUTES: parseNumber(
      resolveEnv("GAMES_INDEX_INTERVAL_IN_MINUTES"),
      60,
    ),
    SUPPORTED_FILE_FORMATS: parseList(
      resolveEnv("GAMES_SUPPORTED_FILE_FORMATS"),
      globals.SUPPORTED_FILE_FORMATS,
    ),
    SEARCH_RECURSIVE: parseBooleanEnvVariable(
      resolveEnv("GAMES_SEARCH_RECURSIVE"),
      true,
    ),
    SEARCH_EXCLUDE_FILE_REGEX: parseRegExp(
      resolveEnv("GAMES_SEARCH_EXCLUDE_FILE_REGEX"),
    ),
    SEARCH_EXCLUDE_DIR_REGEX: parseRegExp(
      resolveEnv("GAMES_SEARCH_EXCLUDE_DIR_REGEX"),
    ),
    INDEX_CONCURRENCY: parseNumber(resolveEnv("GAMES_INDEX_CONCURRENCY"), 1),
    DEFAULT_ARCHIVE_PASSWORD:
      resolveEnv("GAMES_DEFAULT_ARCHIVE_PASSWORD") || "Anything",
    WINDOWS_SETUP_DEFAULT_INSTALL_PARAMETERS:
      resolveEnv("GAMES_WINDOWS_SETUP_DEFAULT_INSTALL_PARAMETERS") ||
      '/D="%INSTALLDIR%" /S /DIR="%INSTALLDIR%" /SILENT /COMPONENTS=text',
    MAX_UPLOAD_SIZE:
      bytes(toLower(resolveEnv("GAMES_MAX_UPLOAD_SIZE"))) ?? bytes("100gb"),
  } as const,
  MEDIA: {
    MAX_SIZE: bytes(toLower(resolveEnv("MEDIA_MAX_SIZE"))) ?? bytes("10mb"),
    SUPPORTED_FORMATS: parseList(
      resolveEnv("MEDIA_SUPPORTED_FORMATS"),
      globals.SUPPORTED_MEDIA_FORMATS,
    ),
    GC_DISABLED: parseBooleanEnvVariable(
      resolveEnv("MEDIA_GC_DISABLED"),
      false,
    ),
    GC_INTERVAL_IN_MINUTES: parseNumber(
      resolveEnv("MEDIA_GC_INTERVAL_IN_MINUTES"),
      60,
    ),
  } as const,
  SAVEFILES: {
    ENABLED: parseBooleanEnvVariable(resolveEnv("SAVEFILES_ENABLED"), false),
    MAX_SIZE: bytes(toLower(resolveEnv("SAVEFILES_MAX_SIZE"))) ?? bytes("1gb"),
    MAX_SAVES: parseNumber(resolveEnv("SAVEFILES_MAX_SAVES"), 10),
  } as const,
  METADATA: {
    TTL_IN_DAYS: parseNumber(resolveEnv("METADATA_TTL_IN_DAYS"), 30),
    IGDB: {
      ENABLED: parseBooleanEnvVariable(
        resolveEnv("METADATA_IGDB_ENABLED"),
        true,
      ),
      PRIORITY: parseNumber(resolveEnv("METADATA_IGDB_PRIORITY"), 10),
      REQUEST_INTERVAL_MS: parseNumber(
        resolveEnv("METADATA_IGDB_REQUEST_INTERVAL_MS"),
        250,
      ),
      CLIENT_ID: resolveEnv("METADATA_IGDB_CLIENT_ID") || undefined,
      CLIENT_SECRET: resolveEnv("METADATA_IGDB_CLIENT_SECRET") || undefined,
    } as const,
  } as const,
  TESTING: {
    AUTHENTICATION_DISABLED: parseBooleanEnvVariable(
      resolveEnv("TESTING_AUTHENTICATION_DISABLED"),
    ),
    MOCK_FILES: parseBooleanEnvVariable(resolveEnv("TESTING_MOCK_FILES")),
    IN_MEMORY_DB: parseBooleanEnvVariable(resolveEnv("TESTING_IN_MEMORY_DB")),
    MOCK_PROVIDERS: parseBooleanEnvVariable(
      resolveEnv("TESTING_MOCK_PROVIDERS"),
    ),
    LOG_HTTP_TRAFFIC_ENABLED: parseBooleanEnvVariable(
      resolveEnv("TESTING_LOG_HTTP_TRAFFIC_ENABLED"),
    ),
  } as const,
  AUTH: {
    SEED:
      safeHash(resolveEnv("AUTH_SEED")) ||
      safeHash(resolveEnv("DB_PASSWORD")) ||
      safeHash(resolveEnv("SERVER_ADMIN_PASSWORD")) ||
      safeHash(resolveEnv("AUTH_OAUTH2_CLIENT_SECRET")) ||
      safeHash(resolveEnv("METADATA_IGDB_CLIENT_SECRET")) ||
      randomBytes(32).toString("hex"),
    ACCESS_TOKEN: {
      get SECRET() {
        return createHash("sha256")
          .update(configuration.AUTH.SEED)
          .digest("hex");
      },
      EXPIRES_IN: resolveEnv("AUTH_ACCESS_TOKEN_EXPIRES_IN") || "5m",
    } as const,
    REFRESH_TOKEN: {
      get SECRET() {
        return createHash("sha256")
          .update(configuration.AUTH.ACCESS_TOKEN.SECRET)
          .digest("hex");
      },
      EXPIRES_IN: resolveEnv("AUTH_REFRESH_TOKEN_EXPIRES_IN") || "30d",
    } as const,
    API_KEY: {
      ENABLED: parseBooleanEnvVariable(resolveEnv("AUTH_API_KEY_ENABLED")),
    } as const,
    OAUTH2: {
      ENABLED: parseBooleanEnvVariable(resolveEnv("AUTH_OAUTH2_ENABLED")),
      SCOPES: parseList(resolveEnv("AUTH_OAUTH2_SCOPES"), [
        "openid",
        "email",
        "profile",
      ]),
      AUTH_URL: resolveEnv("AUTH_OAUTH2_AUTH_URL") || undefined,
      TOKEN_URL: resolveEnv("AUTH_OAUTH2_TOKEN_URL") || undefined,
      CALLBACK_URL: resolveEnv("AUTH_OAUTH2_CALLBACK_URL") || undefined,
      USERINFO_URL: resolveEnv("AUTH_OAUTH2_USERINFO_URL") || undefined,
      CLIENT_ID: resolveEnv("AUTH_OAUTH2_CLIENT_ID") || undefined,
      CLIENT_SECRET: resolveEnv("AUTH_OAUTH2_CLIENT_SECRET") || undefined,
    } as const,
    BASIC_AUTH: {
      ENABLED: parseBooleanEnvVariable(
        resolveEnv("AUTH_BASIC_AUTH_ENABLED"),
        true,
      ),
    } as const,
  } as const,
} as const;

export const CONFIG_NAMESPACE = "gamevault";

export const gamevaultConfiguration = registerAs(
  CONFIG_NAMESPACE,
  () => configuration,
);

export type AppConfiguration = typeof configuration;

export function getCensoredConfiguration() {
  const censoredConfig = JSON.parse(
    JSON.stringify(configuration, (_k, v) => (v === undefined ? null : v)),
  );
  censoredConfig.DB.PASSWORD = censoredConfig.DB.PASSWORD
    ? "**REDACTED**"
    : null;
  censoredConfig.SERVER.ADMIN_PASSWORD = censoredConfig.SERVER.ADMIN_PASSWORD
    ? "**REDACTED**"
    : null;
  censoredConfig.METADATA.IGDB.CLIENT_ID = censoredConfig.METADATA.IGDB
    .CLIENT_ID
    ? "**REDACTED**"
    : null;
  censoredConfig.METADATA.IGDB.CLIENT_SECRET = censoredConfig.METADATA.IGDB
    .CLIENT_SECRET
    ? "**REDACTED**"
    : null;
  censoredConfig.AUTH.SECRET = censoredConfig.AUTH.SECRET
    ? "**REDACTED**"
    : null;
  censoredConfig.AUTH.SEED = censoredConfig.AUTH.SEED ? "**REDACTED**" : null;
  return censoredConfig;
}

export default configuration;
