import { SetMetadata } from "@nestjs/common";
import { AuthenticationGuard } from "../modules/auth/guards/authentication.guard";

export const DisableAuthenticationGuard = (
  classNames: string[] = [AuthenticationGuard.name],
) => SetMetadata("disable-auth", classNames);
