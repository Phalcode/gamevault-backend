import bytes from "bytes";
import { createHash, randomBytes } from "crypto";
import { toLower } from "lodash";
import packageJson from "../package.json";
import globals from "./globals";

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
  );
}

const configuration = {
  SERVER: {
    PORT: parseNumber(process.env.SERVER_PORT, 8080),
    VERSION: process.env.npm_package_version || packageJson.version,
    DEMO_MODE_ENABLED: parseBooleanEnvVariable(
      process.env.SERVER_DEMO_MODE_ENABLED,
    ),
    LOG_LEVEL: toLower(process.env.SERVER_LOG_LEVEL) || "info",
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
    MAX_DOWNLOAD_BANDWIDTH_IN_KBPS: parseKibibytesToBytes(
      process.env.SERVER_MAX_DOWNLOAD_BANDWIDTH_IN_KBPS,
    ),
    ONLINE_ACTIVITIES_DISABLED: parseBooleanEnvVariable(
      process.env.SERVER_ONLINE_ACTIVITIES_DISABLED,
    ),
    STACK_TRACE_LIMIT: parseNumber(process.env.SERVER_STACK_TRACE_LIMIT, 10),
  } as const,
  WEB_UI: {
    ENABLED: parseBooleanEnvVariable(
      process.env.WEB_UI_ENABLED ||
        process.env.SERVER_WEB_UI_ENABLED ||
        process.env.SERVER_LANDING_PAGE_ENABLED,
      true,
    ),
    VERSION: process.env.WEB_UI_VERSION || undefined,
  } as const,
  VOLUMES: {
    CONFIG: parsePath(process.env.VOLUMES_CONFIG, "/config"),
    FILES: parsePath(process.env.VOLUMES_FILES, "/files"),
    MEDIA: parsePath(process.env.VOLUMES_MEDIA, "/media"),
    LOGS: parsePath(process.env.VOLUMES_LOGS, "/logs"),
    SQLITEDB: parsePath(process.env.VOLUMES_SQLITEDB, "/db"),
    PLUGINS: parsePath(process.env.VOLUMES_PLUGINS, "/plugins"),
    SAVEFILES: parsePath(process.env.VOLUMES_SAVEFILES, "/savefiles"),
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
  USERS: {
    REQUIRE_EMAIL: parseBooleanEnvVariable(process.env.USERS_REQUIRE_EMAIL),
    REQUIRE_FIRST_NAME: parseBooleanEnvVariable(
      process.env.USERS_REQUIRE_FIRST_NAME,
    ),
    REQUIRE_LAST_NAME: parseBooleanEnvVariable(
      process.env.USERS_REQUIRE_LAST_NAME,
    ),
    REQUIRE_BIRTH_DATE: parseBooleanEnvVariable(
      process.env.USERS_REQUIRE_BIRTH_DATE,
    ),
  } as const,
  PARENTAL: {
    AGE_RESTRICTION_ENABLED: parseBooleanEnvVariable(
      process.env.PARENTAL_AGE_RESTRICTION_ENABLED,
    ),
    AGE_OF_MAJORITY: parseNumber(process.env.PARENTAL_AGE_OF_MAJORITY, 18),
  } as const,
  GAMES: {
    INDEX_USE_POLLING: parseBooleanEnvVariable(
      process.env.GAMES_INDEX_USE_POLLING,
    ),
    INDEX_INTERVAL_IN_MINUTES: parseNumber(
      process.env.GAMES_INDEX_INTERVAL_IN_MINUTES,
      60,
    ),
    SUPPORTED_FILE_FORMATS: parseList(
      process.env.GAMES_SUPPORTED_FILE_FORMATS,
      globals.SUPPORTED_FILE_FORMATS,
    ),
    SEARCH_RECURSIVE: parseBooleanEnvVariable(
      process.env.GAMES_SEARCH_RECURSIVE,
      true,
    ),
    DEFAULT_ARCHIVE_PASSWORD:
      process.env.GAMES_DEFAULT_ARCHIVE_PASSWORD || "Anything",
  } as const,
  MEDIA: {
    MAX_SIZE: bytes(toLower(process.env.MEDIA_MAX_SIZE)) ?? bytes("10mb"),
    SUPPORTED_FORMATS: parseList(
      process.env.MEDIA_SUPPORTED_FORMATS,
      globals.SUPPORTED_MEDIA_FORMATS,
    ),
    GC_DISABLED: parseBooleanEnvVariable(process.env.MEDIA_GC_DISABLED, false),
    GC_INTERVAL_IN_MINUTES: parseNumber(
      process.env.MEDIA_GC_INTERVAL_IN_MINUTES,
      60,
    ),
  } as const,
  SAVEFILES: {
    ENABLED: parseBooleanEnvVariable(process.env.SAVEFILES_ENABLED, false),
    MAX_SIZE: bytes(toLower(process.env.SAVEFILES_MAX_SIZE)) ?? bytes("1gb"),
    MAX_SAVES: parseNumber(process.env.SAVEFILES_MAX_SAVES, 10),
  } as const,
  METADATA: {
    TTL_IN_DAYS: parseNumber(process.env.METADATA_TTL_IN_DAYS, 30),
    IGDB: {
      ENABLED: parseBooleanEnvVariable(process.env.METADATA_IGDB_ENABLED, true),
      PRIORITY: parseNumber(process.env.METADATA_IGDB_PRIORITY, 10),
      REQUEST_INTERVAL_MS: parseNumber(
        process.env.METADATA_IGDB_REQUEST_INTERVAL_MS,
        250,
      ),
      CLIENT_ID: process.env.METADATA_IGDB_CLIENT_ID || undefined,
      CLIENT_SECRET: process.env.METADATA_IGDB_CLIENT_SECRET || undefined,
    } as const,
  } as const,
  TESTING: {
    AUTHENTICATION_DISABLED: parseBooleanEnvVariable(
      process.env.TESTING_AUTHENTICATION_DISABLED,
    ),
    MOCK_FILES: parseBooleanEnvVariable(process.env.TESTING_MOCK_FILES),
    IN_MEMORY_DB: parseBooleanEnvVariable(process.env.TESTING_IN_MEMORY_DB),
    MOCK_PROVIDERS: parseBooleanEnvVariable(process.env.TESTING_MOCK_PROVIDERS),
    LOG_HTTP_TRAFFIC_ENABLED: parseBooleanEnvVariable(
      process.env.TESTING_LOG_HTTP_TRAFFIC_ENABLED,
    ),
  } as const,
  AUTH: {
    SEED:
      safeHash(process.env.AUTH_SEED) ||
      safeHash(process.env.DB_PASSWORD) ||
      safeHash(process.env.SERVER_ADMIN_PASSWORD) ||
      safeHash(process.env.AUTH_OAUTH2_CLIENT_SECRET) ||
      safeHash(process.env.METADATA_IGDB_CLIENT_SECRET) ||
      randomBytes(32).toString("hex"),
    ACCESS_TOKEN: {
      get SECRET() {
        return createHash("sha256")
          .update(configuration.AUTH.SEED)
          .digest("hex");
      },
      EXPIRES_IN: process.env.AUTH_ACCESS_TOKEN_EXPIRES_IN || "5m",
    } as const,
    REFRESH_TOKEN: {
      get SECRET() {
        return createHash("sha256")
          .update(configuration.AUTH.ACCESS_TOKEN.SECRET)
          .digest("hex");
      },
      EXPIRES_IN: process.env.AUTH_REFRESH_TOKEN_EXPIRES_IN || "30d",
    } as const,
    API_KEY: {
      ENABLED: parseBooleanEnvVariable(process.env.AUTH_API_KEY_ENABLED),
    } as const,
    OAUTH2: {
      ENABLED: parseBooleanEnvVariable(process.env.AUTH_OAUTH2_ENABLED),
      SCOPES: parseList(process.env.AUTH_OAUTH2_SCOPES, [
        "openid",
        "email",
        "profile",
      ]),
      AUTH_URL: process.env.AUTH_OAUTH2_AUTH_URL || undefined,
      TOKEN_URL: process.env.AUTH_OAUTH2_TOKEN_URL || undefined,
      CALLBACK_URL: process.env.AUTH_OAUTH2_CALLBACK_URL || undefined,
      USERINFO_URL: process.env.AUTH_OAUTH2_USERINFO_URL || undefined,
      CLIENT_ID: process.env.AUTH_OAUTH2_CLIENT_ID || undefined,
      CLIENT_SECRET: process.env.AUTH_OAUTH2_CLIENT_SECRET || undefined,
    } as const,
    BASIC_AUTH: {
      ENABLED: parseBooleanEnvVariable(
        process.env.AUTH_BASIC_AUTH_ENABLED,
        true,
      ),
    } as const,
  } as const,
} as const;

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
