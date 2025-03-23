import { ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class BasicAuthGuard extends AuthGuard("basic") {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const skippedGuards = this.reflector.getAllAndOverride<string[]>(
      "skip-guards",
      [context.getHandler(), context.getClass()],
    );

    if (skippedGuards?.includes(this.constructor.name)) {
      return true;
    }
    return super.canActivate(context);
  }
}
