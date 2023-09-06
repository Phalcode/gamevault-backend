import globals from "./globals";
import packageJson from "../package.json";

function parseBooleanEnvVariable(envVar: string, defaultCase: boolean = false) {
  return envVar?.toLowerCase() === "true" || defaultCase;
}

function parsePath(envVar: string, defaultPath: string) {
  return envVar?.replace(/\/$/, "") || defaultPath;
}

function parseList(envVar: string, defaultList: string[] = []) {
  if (envVar) {
    return envVar.split(",").map((item) => item.trim());
  }
  return defaultList;
}

function parseKibibytesToBytes(
  envVar: string,
  defaultNumber = Number.MAX_SAFE_INTEGER,
) {
  const number = Number(envVar) * 1024;
  if (!number || number < 0 || number > Number.MAX_SAFE_INTEGER) {
    return defaultNumber;
  }
}

export default {
  SERVER: {
    VERSION: process.env.npm_package_version || packageJson.version,
    LOG_LEVEL: process.env.SERVER_LOG_LEVEL || "info",
    LOG_FILES_ENABLED: parseBooleanEnvVariable(
      process.env.SERVER_LOG_FILES_ENABLED,
    ),
    REQUEST_LOG_FORMAT:
      process.env.SERVER_REQUEST_LOG_FORMAT || globals.LOGGING_FORMAT,
    CORS_ALLOWED_ORIGINS: parseList(process.env.SERVER_CORS_ALLOWED_ORIGINS, [
      "*",
    ]),
    REGISTRATION_DISABLED: parseBooleanEnvVariable(
      process.env.SERVER_REGISTRATION_DISABLED,
    ),
    ACCOUNT_ACTIVATION_DISABLED: parseBooleanEnvVariable(
      process.env.SERVER_ACCOUNT_ACTIVATION_DISABLED,
    ),
    ADMIN_USERNAME: process.env.SERVER_ADMIN_USERNAME || undefined,
    ADMIN_PASSWORD: process.env.SERVER_ADMIN_PASSWORD || undefined,
    MAX_DOWNLOAD_BANDWIDTH_IN_KBPS: parseKibibytesToBytes(
      process.env.SERVER_MAX_DOWNLOAD_BANDWIDTH_IN_KBPS,
      10_737_418_240,
    ),
  },
  VOLUMES: {
    FILES: parsePath(process.env.VOLUMES_FILES, "/files"),
    IMAGES: parsePath(process.env.VOLUMES_IMAGES, "/images"),
    LOGS: parsePath(process.env.VOLUMES_LOGS, "/logs"),
    SQLITEDB: parsePath(process.env.VOLUMES_SQLITEDB, "/db"),
  },
  DB: {
    SYSTEM: process.env.DB_SYSTEM || "POSTGRESQL",
    HOST: process.env.DB_HOST || "localhost",
    PORT: Number(process.env.DB_PORT) || 5432,
    USERNAME: process.env.DB_USERNAME || "default",
    PASSWORD: process.env.DB_PASSWORD || "default",
    DATABASE: process.env.DB_DATABASE || "gamevault",
    DEBUG: parseBooleanEnvVariable(process.env.DB_DEBUG),
    SYNCHRONIZE: parseBooleanEnvVariable(process.env.DB_SYNCHRONIZE),
  },
  RAWG_API: {
    URL: process.env.RAWG_API_URL || "https://api.rawg.io/api",
    KEY: process.env.RAWG_API_KEY || "",
    CACHE_DAYS: Number(process.env.RAWG_API_CACHE_DAYS) || 30,
  },
  USERS: {
    REQUIRE_EMAIL: parseBooleanEnvVariable(process.env.USERS_REQUIRE_EMAIL),
    REQUIRE_FIRST_NAME: parseBooleanEnvVariable(
      process.env.USERS_REQUIRE_FIRST_NAME,
    ),
    REQUIRE_LAST_NAME: parseBooleanEnvVariable(
      process.env.USERS_REQUIRE_LAST_NAME,
    ),
  },
  GAMES: {
    INDEX_INTERVAL_IN_MINUTES:
      Number(process.env.GAMES_INDEX_INTERVAL_IN_MINUTES) || 5,
    SUPPORTED_FILE_FORMATS: parseList(
      process.env.GAMES_SUPPORTED_FILE_FORMATS,
      globals.SUPPORTED_FILE_FORMATS,
    ),
    SEARCH_RECURSIVE: parseBooleanEnvVariable(
      process.env.SEARCH_RECURSIVE,
      true,
    ),
  },
  IMAGE: {
    MAX_SIZE_IN_KB:
      Number(process.env.IMAGE_MAX_SIZE_IN_KB) * 1000 || 10_000_000,
    GOOGLE_API_RATE_LIMIT_COOLDOWN_IN_HOURS:
      Number(process.env.IMAGE_GOOGLE_API_RATE_LIMIT_COOLDOWN_IN_HOURS) || 24,
  },
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
  },
};
