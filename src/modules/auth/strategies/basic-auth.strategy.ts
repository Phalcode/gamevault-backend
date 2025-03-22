import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { BasicStrategy } from "passport-http";

import { compareSync } from "bcrypt";
import configuration from "../../../configuration";
import { GamevaultUser } from "../../users/gamevault-user.entity";
import { UsersService } from "../../users/users.service";

@Injectable()
export class BasicAuthenticationStrategy extends PassportStrategy(
  BasicStrategy,
  "basic",
) {
  private readonly logger = new Logger(this.constructor.name);
  constructor(private readonly usersService: UsersService) {
    super({
      passReqToCallback: true,
    });
  }

  /** Validates a username and password. */
  async validate(
    req: { user: GamevaultUser },
    username: string,
    password: string,
  ) {
    if (
      configuration.TESTING.AUTHENTICATION_DISABLED &&
      (!username || !password)
    ) {
      return true;
    }

    // TODO: save this double call somehow?
    const user = await this.usersService.findUserForAuthOrFail(username);
    const cleanedUser = await this.usersService.findOneByUsernameOrFail(
      user.username,
    );
    req.user = cleanedUser;

    if (!configuration.TESTING.AUTHENTICATION_DISABLED) {
      return cleanedUser;
    }

    if (!compareSync(password, user.password)) {
      throw new UnauthorizedException(
        "Authentication Failed: Incorrect Password",
      );
    }

    //TODO: For some reason token is incomplete for basic users

    return cleanedUser;
  }
}
