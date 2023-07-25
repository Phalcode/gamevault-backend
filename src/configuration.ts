import globals from "./globals";

export default {
  SERVER: {
    PORT: Number(process.env.SERVER_PORT) || 8080,
    LOG_LEVEL: process.env.SERVER_LOG_LEVEL || "info",
    LOG_FILES_ENABLED: process.env.SERVER_LOG_FILES_ENABLED === "true" || false,
    REQUEST_LOG_FORMAT:
      process.env.SERVER_REQUEST_LOG_FORMAT ||
      "[:date[clf]] :remote-user @ :remote-addr - :method :url -> :status - :response-time ms - :res[content-length] - ':user-agent'",
    CORS_ALLOWED_ORIGINS: process.env.SERVER_CORS_ALLOWED_ORIGINS || "*",
    REGISTRATION_DISABLED:
      process.env.SERVER_REGISTRATION_DISABLED === "true" || false,
    ACCOUNT_ACTIVATION_DISABLED:
      process.env.SERVER_ACCOUNT_ACTIVATION_DISABLED === "true" || false,
    ADMIN_USERNAME: process.env.SERVER_ADMIN_USERNAME || undefined,
    ADMIN_PASSWORD: process.env.SERVER_ADMIN_PASSWORD || undefined,
  },
  VOLUMES: {
    FILES: process.env.VOLUMES_FILES?.replace(/\/$/, "") || "/files",
    IMAGES: process.env.VOLUMES_IMAGES?.replace(/\/$/, "") || "/images",
    LOGS: process.env.VOLUMES_LOGS?.replace(/\/$/, "") || "/logs",
    SQLITEDB: process.env.VOLUMES_SQLITEDB?.replace(/\/$/, "") || "/db",
  },
  DB: {
    SYSTEM: process.env.DB_SYSTEM || "POSTGRESQL",
    HOST: process.env.DB_HOST || "localhost",
    PORT: Number(process.env.DB_PORT) || 5432,
    USERNAME: process.env.DB_USERNAME || "default",
    PASSWORD: process.env.DB_PASSWORD || "default",
    DATABASE: process.env.DB_DATABASE || "gamevault",
    DEBUG: process.env.DB_DEBUG === "true" || false,
    SYNCHRONIZE: process.env.DB_SYNCHRONIZE === "true" || false,
  },
  RAWG_API: {
    URL: process.env.RAWG_API_URL || "https://api.rawg.io/api",
    KEY: process.env.RAWG_API_KEY || "",
    CACHE_DAYS: Number(process.env.RAWG_API_CACHE_DAYS) || 7,
  },
  GAMES: {
    INDEX_INTERVAL_IN_MINUTES:
      Number(process.env.GAMES_INDEX_INTERVAL_IN_MINUTES) || 5,
    SUPPORTED_FILE_FORMATS: process.env.GAMES_SUPPORTED_FILE_FORMATS
      ? process.env.GAMES_SUPPORTED_FILE_FORMATS.split(",").map((item) =>
          item.trim(),
        )
      : globals.SUPPORTED_FILE_FORMATS,
    SEARCH_RECURSIVE: process.env.SEARCH_RECURSIVE === "true" || true,
  },
  IMAGE: {
    GC_KEEP_DAYS: Number(process.env.IMAGE_GC_KEEP_DAYS) || 30,
    GC_INTERVAL_MINUTES: Number(process.env.IMAGE_GC_INTERVAL_MINUTES) || 60,
    GOOGLE_API_RATE_LIMIT_COOLDOWN_IN_HOURS:
      Number(process.env.IMAGE_GOOGLE_API_RATE_LIMIT_COOLDOWN_IN_HOURS) || 24,
  },
  TESTING: {
    AUTHENTICATION_DISABLED:
      process.env.TESTING_AUTHENTICATION_DISABLED === "true" || false,
    MOCK_FILES: process.env.TESTING_MOCK_FILES === "true" || false,
    IN_MEMORY_DB: process.env.TESTING_IN_MEMORY_DB === "true" || false,
    RAWG_API_DISABLED:
      process.env.TESTING_RAWG_API_DISABLED === "true" || false,
    GOOGLE_API_DISABLED:
      process.env.TESTING_GOOGLE_API_DISABLED === "true" || false,
  },
};
