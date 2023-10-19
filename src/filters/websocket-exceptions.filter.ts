import { ArgumentsHost, Catch, HttpException, Logger } from "@nestjs/common";
import { BaseWsExceptionFilter, WsException } from "@nestjs/websockets";

@Catch(HttpException)
export class WebsocketExceptionsFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WebsocketExceptionsFilter.name);
  catch(exception: HttpException, host: ArgumentsHost) {
    this.logger.error(exception, exception.stack, {
      _context: "ExceptionHandler",
    });
    const convertedException = new WsException(exception.getResponse());
    super.handleError(host.switchToWs().getClient(), convertedException);
    super.catch(convertedException, host);
  }
}
