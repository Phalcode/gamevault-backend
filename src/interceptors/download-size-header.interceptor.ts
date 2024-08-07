import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Response as ExpressResponse } from "express";
import { Observable } from "rxjs";

@Injectable()
export class DownloadSizeHeaderInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const res: ExpressResponse = context.switchToHttp().getResponse();
    const length = res.getHeader("Content-Length");
    if (length) {
      res.setHeader("X-Download-Size", length);
    }
    return next.handle();
  }
}
