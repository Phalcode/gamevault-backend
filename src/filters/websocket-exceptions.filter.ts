import { ArgumentsHost, Catch, HttpException, Logger } from "@nestjs/common";
import { BaseWsExceptionFilter, WsException } from "@nestjs/websockets";

@Catch(HttpException)
export class WebsocketExceptionsFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WebsocketExceptionsFilter.name);
  catch(error: HttpException, host: ArgumentsHost) {
    this.logger.error(error, error.stack, {
      _context: "ExceptionHandler",
    });
    const convertedException = new WsException(error.getResponse());
    super.handleError(host.switchToWs().getClient(), convertedException);
    super.catch(convertedException, host);
  }
}
