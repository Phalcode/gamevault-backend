import { SetMetadata } from "@nestjs/common";
import { AuthenticationGuard } from "../modules/auth/guards/authentication.guard";

export const SkipGuards = (classNames: string[] = [AuthenticationGuard.name]) =>
  SetMetadata("skip-guards", classNames);
