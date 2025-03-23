import { SetMetadata } from "@nestjs/common";
import { AuthenticationGuard } from "../modules/auth/guards/authentication.guard";

export const SKIP_GUARDS_KEY = "skip-guards";
export const SkipGuards = (classNames: string[] = [AuthenticationGuard.name]) =>
  SetMetadata(SKIP_GUARDS_KEY, classNames);
