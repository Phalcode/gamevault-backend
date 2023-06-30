import { WinstonModule } from "nest-winston";
import winston from "winston";
import { consoleFormat } from "winston-console-format";

import configuration from "./configuration";

const transports: winston.transport[] = [
  new winston.transports.Console({
    level: configuration.SERVER.LOG_LEVEL,
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.padLevels(),
      consoleFormat({
        showMeta: true,
        inspectOptions: {
          depth: 3,
          colors: true,
          numericSeparator: true,
          breakLength: 120,
          sorted: true,
        },
      }),
    ),
  }),
];

const logger = WinstonModule.createLogger({
  exitOnError: false,
  transports: transports,
  handleExceptions: true,
});

const stream = {
  write: function (message) {
    logger.log(message, "Morgan");
  },
};

export default logger;
export { stream };
