import {
  type ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
  PayloadTooLargeException,
} from "@nestjs/common";
import { type Request, type Response } from "express";

@Catch()
export class LoggingExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(this.constructor.name);

  /** Handles exceptions that occur during request processing. */
  catch(error: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const httpException =
      error instanceof HttpException
        ? error
        : LoggingExceptionFilter.mapMulterError(error);

    if (httpException) {
      const httpStatusCode = httpException.getStatus();
      if (httpStatusCode >= 400 && httpStatusCode < 500) {
        this.logger.warn({
          message: `${httpException.name} occurred.`,
          path: request.url,
          response: httpException.getResponse(),
          error,
        });
      } else {
        this.logger.error({
          message: `${httpException.name} occurred.`,
          path: request.url,
          response: httpException.getResponse(),
          error,
        });
      }
      response.status(httpStatusCode).json(httpException.getResponse());
      return;
    }

    // All other unhandled Exceptions
    this.logger.error({
      message: `Unhandled ${error.name} occurred.`,
      path: request.url,
      error,
    });
    response.status(500).json({
      message:
        "Unhandled Server Error. Please check the server logs for more details.",
      error: "Unhandled Server Error",
      statusCode: 500,
    });
  }

  /**
   * Translates errors thrown by the Multer upload middleware into proper HTTP
   * exceptions, so rejected uploads don't surface as unhandled 500 errors.
   */
  private static mapMulterError(error: Error): HttpException | undefined {
    if (error.name !== "MulterError") {
      return undefined;
    }

    const code = (error as Error & { code?: string }).code;
    if (code === "LIMIT_FILE_SIZE") {
      return new PayloadTooLargeException(
        "The uploaded file exceeds the maximum allowed upload size.",
      );
    }

    return new BadRequestException(
      `The upload was rejected (${code ?? "invalid upload"}).`,
    );
  }
}
