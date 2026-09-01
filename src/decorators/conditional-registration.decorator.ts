import configuration from "../configuration.js";
import { AuthenticationGuard } from "../modules/auth/guards/authentication.guard.js";
import { BasicAuthGuard } from "../modules/auth/guards/basic-auth.guard.js";
import { SkipGuards } from "./skip-guards.decorator.js";

export const ConditionalRegistration = configuration.SERVER
  .REGISTRATION_DISABLED
  ? SkipGuards([BasicAuthGuard.name])
  : SkipGuards([AuthenticationGuard.name, BasicAuthGuard.name]);
