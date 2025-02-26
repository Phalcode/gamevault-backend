import { ArgumentsHost, Catch, HttpException, Logger } from "@nestjs/common";
import { BaseWsExceptionFilter, WsException } from "@nestjs/websockets";

@Catch(HttpException)
export class WebsocketExceptionsFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(this.constructor.name);
  catch(error: HttpException, host: ArgumentsHost) {
    this.logger.error({
      message: `Unhandled ${error.name} occurred in websocket: ${error.message}`,
      error,
    });
    const convertedException = new WsException(error.getResponse());
    super.handleError(host.switchToWs().getClient(), convertedException);
    super.catch(convertedException, host);
  }
}
