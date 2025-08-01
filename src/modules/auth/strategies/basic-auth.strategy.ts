import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { BasicStrategy } from "passport-http";

import { compare } from "bcrypt";
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
    request: { user: GamevaultUser },
    username: string,
    password: string,
  ) {
    const user = await this.usersService.findUserForAuthOrFail({
      username,
      email: username,
    });
    const cleanedUser = await this.usersService.findOneByUsernameOrFail(
      user.username,
    );
    request.user = cleanedUser;

    if (!(await compare(password, user.password))) {
      throw new UnauthorizedException(
        "Authentication Failed: Incorrect Password",
      );
    }
    return cleanedUser;
  }
}
