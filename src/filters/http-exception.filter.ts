import {
  ExceptionFilter,
  Catch,
  HttpException,
  ArgumentsHost,
  Logger,
} from "@nestjs/common";

import { Request, Response } from "express";

@Catch()
export class LoggingExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(LoggingExceptionFilter.name);

  /** Handles exceptions that occur during request processing. */
  catch(error: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const httpStatusCode =
      error instanceof HttpException ? error.getStatus() : 500;
    if (error instanceof HttpException) {
      if (httpStatusCode >= 400 && httpStatusCode < 500) {
        this.logger.warn(`${error.name} occurred: ${error.message}`, {
          path: request.url,
          response: error.getResponse(),
        });
      } else {
        this.logger.error(
          {
            path: request.url,
            error,
          },
          `${error.name} occurred: ${error.message}`,
        );
      }
      response.status(httpStatusCode).json(error.getResponse());
    } else {
      // All other unhandled Exceptions
      this.logger.error(
        { url: request.url, error },
        `Unhandled ${error.name} occurred: ${error.message}`,
      );
      response.status(httpStatusCode).json({
        message: "Please check the server logs for more details.",
        error: "Unhandled Server Error",
        statusCode: httpStatusCode,
      });
    }
  }
}
