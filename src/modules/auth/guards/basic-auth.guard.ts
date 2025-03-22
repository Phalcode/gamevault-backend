import { ExecutionContext, Injectable, Logger } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class BasicAuthGuard extends AuthGuard("basic") {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const disabledFor = this.reflector.getAllAndOverride<string[]>(
      "disable-auth",
      [context.getHandler(), context.getClass()],
    );

    if (disabledFor?.includes(this.constructor.name)) {
      return true;
    }
    return super.canActivate(context);
  }
}
