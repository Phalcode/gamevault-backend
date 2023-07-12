import { WinstonModule } from "nest-winston";
import winston from "winston";
import { consoleFormat } from "winston-console-format";
import DailyRotateFile from "winston-daily-rotate-file";

import configuration from "./configuration";

const transports: winston.transport[] = [
  new winston.transports.Console({
    level: configuration.SERVER.LOG_LEVEL,
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.padLevels(),
      consoleFormat({
        inspectOptions: {
          depth: 3,
          colors: true,
          numericSeparator: true,
          sorted: true,
        },
      }),
    ),
  }),
  new DailyRotateFile({
    level: "debug",
    filename: "crackpipe-backend-%DATE%.log",
    dirname: configuration.VOLUMES.LOGS,
    datePattern: "YYYY-MM-DD",
    maxFiles: "14d",
    maxSize: "20m",
  }),
];

const logger = WinstonModule.createLogger({
  exitOnError: false,
  transports: transports,
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
  write: function (message) {
    logger.log(message, "Morgan");
  },
};

export default logger;
export { stream };
