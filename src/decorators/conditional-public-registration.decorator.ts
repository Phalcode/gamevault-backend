import configuration from "../configuration";
import { AuthenticationGuard } from "../modules/auth/guards/authentication.guard";
import { BasicAuthGuard } from "../modules/auth/guards/basic-auth.guard";
import { DisableAuthenticationGuard } from "./disable-authentication-guard";

export const ConditionalRegistrationAccessibility = configuration.SERVER
  .REGISTRATION_DISABLED
  ? DisableAuthenticationGuard([BasicAuthGuard.name])
  : DisableAuthenticationGuard([AuthenticationGuard.name, BasicAuthGuard.name]);
