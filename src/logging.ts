import { WinstonModule } from "nest-winston";
import winston from "winston";
import { consoleFormat } from "winston-console-format";
import DailyRotateFile from "winston-daily-rotate-file";

import configuration from "./configuration";
import { GamevaultGame } from "./modules/games/gamevault-game.entity";
import { Media } from "./modules/media/media.entity";
import { Metadata } from "./modules/metadata/models/metadata.interface";
import { MetadataProvider } from "./modules/metadata/providers/abstract.metadata-provider.service";
import { Progress } from "./modules/progresses/progress.entity";
import { GamevaultUser } from "./modules/users/gamevault-user.entity";

const transports: winston.transport[] = [];

if (configuration.SERVER.LOG_LEVEL != "off") {
  transports.push(
    new winston.transports.Console({
      level: configuration.SERVER.LOG_LEVEL,
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.padLevels(),
        consoleFormat({
          inspectOptions: {
            depth: 3,
            colors: true,
            sorted: true,
          },
        }),
      ),
    }),
  );
}

if (
  configuration.SERVER.LOG_FILES_ENABLED &&
  !configuration.TESTING.MOCK_FILES
) {
  transports.push(
    new DailyRotateFile({
      level: "debug",
      filename: "gamevault-backend-%DATE%.log",
      dirname: configuration.VOLUMES.LOGS,
      datePattern: "YYYY-MM-DD",
      maxFiles: "14d",
      maxSize: "20m",
    }),
  );
}

const logger = WinstonModule.createLogger({
  exitOnError: false,
  transports,
  handleExceptions: true,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.ms(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
  ),
});

const stream = {
  write(message: string) {
    logger.log(message, "HTTP Request");
  },
};

function logGamevaultGame(game: GamevaultGame) {
  return {
    id: game?.id,
    title: game?.title,
    file_path: game?.file_path,
  };
}

function logGamevaultUser(user: GamevaultUser) {
  return {
    id: user?.id,
    username: user?.username,
    role: user?.role,
  };
}

function logMetadata(metadata: Metadata) {
  return {
    id: metadata?.id,
    provider_slug: metadata?.provider_slug,
    provider_data_id: metadata?.provider_data_id,
    created_at: metadata.created_at,
    updated_at: metadata.updated_at,
  };
}

function logProgress(progress: Progress) {
  return {
    id: progress?.id,
    minutes_played: progress?.minutes_played,
    state: progress?.state,
    last_played_at: progress?.last_played_at,
    user: logGamevaultUser(progress?.user),
    game: logGamevaultGame(progress?.game),
  };
}

function logMetadataProvider(provider: MetadataProvider) {
  return {
    slug: provider?.slug,
    priority: provider?.priority,
    enabled: provider?.enabled,
    request_interval_ms: provider?.request_interval_ms,
  };
}

function logMedia(media: Media) {
  return {
    id: media?.id,
    source_url: media?.source_url,
    file_path: media?.file_path,
    type: media?.type,
    uploader: logGamevaultUser(media?.uploader),
  };
}

export default logger;
export {
  logGamevaultGame,
  logGamevaultUser,
  logMedia,
  logMetadata,
  logMetadataProvider,
  logProgress,
  stream
};

