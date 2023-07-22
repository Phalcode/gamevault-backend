export default {
  SERVER: {
    // The port the server should listen on
    PORT: Number(process.env.SERVER_PORT) || 8080,

    // The Log Level (debug, info, warn, error, fatal, off)
    LOG_LEVEL: process.env.SERVER_LOG_LEVEL || "info",

    // Wheter or not the server logs to files
    LOG_FILES_ENABLED: process.env.SERVER_LOG_FILES_ENABLED === "true" || false,

    // Morgan Request Log Format
    REQUEST_LOG_FORMAT:
      process.env.SERVER_REQUEST_LOG_FORMAT ||
      "[:date[clf]] :remote-user @ :remote-addr - :method :url -> :status - :response-time ms - :res[content-length] - ':user-agent'",

    // Allowed CORS origins
    CORS_ALLOWED_ORIGINS: process.env.SERVER_CORS_ALLOWED_ORIGINS || "*",

    // If registration is enabled or not
    REGISTRATION_DISABLED:
      process.env.SERVER_REGISTRATION_DISABLED === "true" || false,

    // If accounts need to be activated by an admin before using them
    ACCOUNT_ACTIVATION_DISABLED:
      process.env.SERVER_ACCOUNT_ACTIVATION_DISABLED === "true" || false,

    // Automatically Grants Admin Permissions to User with this username upon registration or upon startup
    ADMIN_USERNAME: process.env.SERVER_ADMIN_USERNAME || undefined,

    // Automatically Sets Password of the ADMIN_USERNAME Account to this value upon startup
    ADMIN_PASSWORD: process.env.SERVER_ADMIN_PASSWORD || undefined,
  },
  VOLUMES: {
    // Location of the files
    FILES: process.env.VOLUMES_FILES?.replace(/\/$/, "") || "/files",
    // Location of the images
    IMAGES: process.env.VOLUMES_IMAGES?.replace(/\/$/, "") || "/images",
    // Location of the Log files
    LOGS: process.env.VOLUMES_LOGS?.replace(/\/$/, "") || "/logs",
    // Location of the SQLITE DB (not needed for POSTGRESQL)
    SQLITEDB: process.env.VOLUMES_SQLITEDB?.replace(/\/$/, "") || "/db",
  },
  DB: {
    // The database system (POSTGRESQL or SQLITE)
    SYSTEM: process.env.DB_SYSTEM || "POSTGRESQL",

    // The host of the database (not needed for SQLITE)
    HOST: process.env.DB_HOST || "localhost",

    // The port of the database (not needed for SQLITE)
    PORT: Number(process.env.DB_PORT) || 5432,

    // The username for the database (not needed for SQLITE)
    USERNAME: process.env.DB_USERNAME || "default",

    // The password for the database (not needed for SQLITE)
    PASSWORD: process.env.DB_PASSWORD || "default",

    // The database name (not needed for SQLITE)
    DATABASE: process.env.DB_DATABASE || "gamevault",

    // Log all SQL Statements sent to the database
    DEBUG: process.env.DB_DEBUG === "true" || false,

    // Synchronize the database (use if create table failure occurs but watch out, it could break your db)
    SYNCHRONIZE: process.env.DB_SYNCHRONIZE === "true" || false,
  },
  RAWG_API: {
    // Base URL of RAWG API
    URL: process.env.RAWG_API_URL || "https://api.rawg.io/api",

    // API key for RAWG API
    KEY: process.env.RAWG_API_KEY || "",

    // When to renew RAWG API cached data (in days)
    CACHE_DAYS: Number(process.env.RAWG_API_CACHE_DAYS) || 7,
  },
  GAMES: {
    // index interval (in minutes)
    INDEX_INTERVAL_IN_MINUTES:
      Number(process.env.GAMES_INDEX_INTERVAL_IN_MINUTES) || 5,
  },
  IMAGE: {
    // How long an image must be not accessed until it gets deleted.
    GC_KEEP_DAYS: Number(process.env.IMAGE_GC_KEEP_DAYS) || 30,
    // How often to run the Image Garbage collection in minutes
    GC_INTERVAL_MINUTES: Number(process.env.IMAGE_GC_INTERVAL_MINUTES) || 60,
    // Google Image Search API Cooldown in hours when hitting the rate limit
    GOOGLE_API_RATE_LIMIT_COOLDOWN_IN_HOURS:
      Number(process.env.IMAGE_GOOGLE_API_RATE_LIMIT_COOLDOWN_IN_HOURS) || 24,
  },
  TESTING: {
    // If true, the API will accept any auth header
    AUTHENTICATION_DISABLED:
      process.env.TESTING_AUTHENTICATION_DISABLED === "true" || false,

    // Mock existing game files
    MOCK_FILES: process.env.TESTING_MOCK_FILES === "true" || false,

    // Fake in-memory database (only with SQLite)
    IN_MEMORY_DB: process.env.TESTING_IN_MEMORY_DB === "true" || false,

    // Disable external API calls to RAWG
    RAWG_API_DISABLED:
      process.env.TESTING_RAWG_API_DISABLED === "true" || false,

    // Disable external API calls to Google
    GOOGLE_API_DISABLED:
      process.env.TESTING_GOOGLE_API_DISABLED === "true" || false,
  },
};
