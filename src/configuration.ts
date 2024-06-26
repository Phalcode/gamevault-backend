import packageJson from "../package.json";
import globals from "./globals";

function parseBooleanEnvVariable(
  environmentVariable: string,
  defaultCase: boolean = false,
): boolean {
  switch (environmentVariable?.toLocaleLowerCase()) {
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

function parseNumberList(
  environmentVariable: string,
  defaultList: number[] = [],
): number[] {
  return environmentVariable
    ? environmentVariable
        .split(",")
        .map((item) => Number(item.trim()))
        .filter((item) => !isNaN(item))
    : defaultList;
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

const configuration = {
  SERVER: {
    PORT: parseNumber(process.env.SERVER_PORT, 8080),
    VERSION: process.env.npm_package_version || packageJson.version,
    DEMO_MODE_ENABLED: parseBooleanEnvVariable(
      process.env.SERVER_DEMO_MODE_ENABLED,
    ),
    LOG_LEVEL: process.env.SERVER_LOG_LEVEL || "info",
    LOG_FILES_ENABLED: parseBooleanEnvVariable(
      process.env.SERVER_LOG_FILES_ENABLED,
      true,
    ),
    REQUEST_LOG_FORMAT:
      process.env.SERVER_REQUEST_LOG_FORMAT || globals.LOGGING_FORMAT,
    CORS_ALLOWED_ORIGINS: parseList(
      process.env.SERVER_CORS_ALLOWED_ORIGINS,
      [],
    ),
    REGISTRATION_DISABLED: parseBooleanEnvVariable(
      process.env.SERVER_REGISTRATION_DISABLED,
    ),
    ACCOUNT_ACTIVATION_DISABLED: parseBooleanEnvVariable(
      process.env.SERVER_ACCOUNT_ACTIVATION_DISABLED,
    ),
    ADMIN_USERNAME: process.env.SERVER_ADMIN_USERNAME || undefined,
    ADMIN_PASSWORD: process.env.SERVER_ADMIN_PASSWORD || undefined,
    API_DOCS_ENABLED: parseBooleanEnvVariable(
      process.env.SERVER_API_DOCS_ENABLED,
    ),
    MAX_DOWNLOAD_BANDWIDTH_IN_KBPS: parseKibibytesToBytes(
      process.env.SERVER_MAX_DOWNLOAD_BANDWIDTH_IN_KBPS,
    ),
    ONLINE_ACTIVITIES_DISABLED: parseBooleanEnvVariable(
      process.env.SERVER_ONLINE_ACTIVITIES_DISABLED,
    ),
  } as const,
  VOLUMES: {
    FILES: parsePath(process.env.VOLUMES_FILES, "/files"),
    IMAGES: parsePath(process.env.VOLUMES_IMAGES, "/images"),
    LOGS: parsePath(process.env.VOLUMES_LOGS, "/logs"),
    SQLITEDB: parsePath(process.env.VOLUMES_SQLITEDB, "/db"),
  } as const,
  DB: {
    SYSTEM: process.env.DB_SYSTEM || "POSTGRESQL",
    HOST: process.env.DB_HOST || "localhost",
    PORT: parseNumber(process.env.DB_PORT, 5432),
    USERNAME: process.env.DB_USERNAME || "default",
    PASSWORD: process.env.DB_PASSWORD || "default",
    DATABASE: process.env.DB_DATABASE || "gamevault",
    DEBUG: parseBooleanEnvVariable(process.env.DB_DEBUG),
    SYNCHRONIZE: parseBooleanEnvVariable(process.env.DB_SYNCHRONIZE),
    TLS: {
      ENABLED: parseBooleanEnvVariable(process.env.DB_TLS_ENABLED),
      REJECT_UNAUTHORIZED_ENABLED: parseBooleanEnvVariable(
        process.env.DB_TLS_REJECT_UNAUTHORIZED_ENABLED,
      ),
      KEY_PATH: parsePath(process.env.DB_TLS_KEY_PATH, ""),
      CERTIFICATE_PATH: parsePath(process.env.DB_TLS_CERTIFICATE_PATH, ""),
      CA_CERTIFICATE_PATH: parsePath(
        process.env.DB_TLS_CA_CERTIFICATE_PATH,
        "",
      ),
    },
  } as const,
  RAWG_API: {
    URL: process.env.RAWG_API_URL || "https://api.rawg.io/api",
    KEY: process.env.RAWG_API_KEY || "",
    CACHE_DAYS: parseNumber(process.env.RAWG_API_CACHE_DAYS, 30),
    INCLUDED_STORES: parseNumberList(
      process.env.RAWG_API_INCLUDED_STORES,
      globals.DEFAULT_INCLUDED_RAWG_STORES,
    ),
    INCLUDED_PLATFORMS: parseNumberList(
      process.env.RAWG_API_INCLUDED_PLATFORMS,
      globals.DEFAULT_INCLUDED_RAWG_PLATFORMS,
    ),
  } as const,
  USERS: {
    REQUIRE_EMAIL: parseBooleanEnvVariable(process.env.USERS_REQUIRE_EMAIL),
    REQUIRE_FIRST_NAME: parseBooleanEnvVariable(
      process.env.USERS_REQUIRE_FIRST_NAME,
    ),
    REQUIRE_LAST_NAME: parseBooleanEnvVariable(
      process.env.USERS_REQUIRE_LAST_NAME,
    ),
  } as const,
  GAMES: {
    INDEX_INTERVAL_IN_MINUTES: parseNumber(
      process.env.GAMES_INDEX_INTERVAL_IN_MINUTES,
      60,
    ),
    SUPPORTED_FILE_FORMATS: parseList(
      process.env.GAMES_SUPPORTED_FILE_FORMATS,
      globals.SUPPORTED_FILE_FORMATS,
    ),
    SEARCH_RECURSIVE: parseBooleanEnvVariable(
      process.env.SEARCH_RECURSIVE,
      true,
    ),
    DEFAULT_ARCHIVE_PASSWORD: process.env.GAMES_DEFAULT_ARCHIVE_PASSWORD || "Anything",
  } as const,
  IMAGE: {
    MAX_SIZE_IN_KB:
      parseNumber(process.env.IMAGE_MAX_SIZE_IN_KB, 1000) * 10_000,
    GOOGLE_API_RATE_LIMIT_COOLDOWN_IN_HOURS: parseNumber(
      process.env.IMAGE_GOOGLE_API_RATE_LIMIT_COOLDOWN_IN_HOURS,
      24,
    ),
    SUPPORTED_IMAGE_FORMATS: parseList(
      process.env.GAMES_SUPPORTED_IMAGE_FORMATS,
      globals.SUPPORTED_IMAGE_FORMATS,
    ),
    GC_DISABLED: parseBooleanEnvVariable(process.env.IMAGE_GC_DISABLED, false),
    GC_INTERVAL_IN_MINUTES: parseNumber(
      process.env.IMAGE_GC_INTERVAL_IN_MINUTES,
      24,
    ),
  } as const,
  TESTING: {
    AUTHENTICATION_DISABLED: parseBooleanEnvVariable(
      process.env.TESTING_AUTHENTICATION_DISABLED,
    ),
    MOCK_FILES: parseBooleanEnvVariable(process.env.TESTING_MOCK_FILES),
    IN_MEMORY_DB: parseBooleanEnvVariable(process.env.TESTING_IN_MEMORY_DB),
    RAWG_API_DISABLED: parseBooleanEnvVariable(
      process.env.TESTING_RAWG_API_DISABLED,
    ),
    GOOGLE_API_DISABLED: parseBooleanEnvVariable(
      process.env.TESTING_GOOGLE_API_DISABLED,
    ),
  } as const,
  PLUGIN: {
    ENABLED: parseBooleanEnvVariable(process.env.PLUGIN_ENABLED),
    SOURCES: parseList(process.env.PLUGIN_SOURCES, []),
  } as const,
} as const;

export function getCensoredConfiguration() {
  const censoredConfig = JSON.parse(JSON.stringify(configuration));
  censoredConfig.DB.PASSWORD = "**REDACTED**";
  censoredConfig.SERVER.ADMIN_PASSWORD = "**REDACTED**";
  censoredConfig.RAWG_API.KEY = "**REDACTED**";
  return censoredConfig;
}

export default configuration;
