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
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const httpStatusCode =
      exception instanceof HttpException ? exception.getStatus() : 500;
    if (exception instanceof HttpException) {
      if (httpStatusCode >= 400 && httpStatusCode < 500) {
        this.logger.warn(`${exception.name} occurred: ${exception.message}`, {
          path: request.url,
          response: exception.getResponse(),
        });
      } else {
        this.logger.error(
          {
            path: request.url,
            exception,
          },
          `${exception.name} occurred: ${exception.message}`,
        );
      }
      response.status(httpStatusCode).json(exception.getResponse());
    } else {
      // All other unhandled Exceptions
      this.logger.error(
        { url: request.url, error: exception },
        `Unhandled ${exception.name} occurred: ${exception.message}`,
      );
      response.status(httpStatusCode).json(exception.message);
    }
  }
}
