import configuration from "../configuration";
import { AuthenticationGuard } from "../modules/auth/guards/authentication.guard";
import { BasicAuthGuard } from "../modules/auth/guards/basic-auth.guard";
import { SkipGuards } from "./skip-guards.decorator";

export const ConditionalRegistration = configuration.SERVER
  .REGISTRATION_DISABLED
  ? SkipGuards([BasicAuthGuard.name])
  : SkipGuards([AuthenticationGuard.name, BasicAuthGuard.name]);
