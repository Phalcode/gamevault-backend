import { Injectable, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { BasicStrategy } from "passport-http";

import configuration from "../../configuration";
import { GamevaultUser } from "../users/gamevault-user.entity";
import { UsersService } from "../users/users.service";

@Injectable()
export class DefaultStrategy extends PassportStrategy(BasicStrategy) {
  private readonly logger = new Logger(this.constructor.name);
  constructor(private usersService: UsersService) {
    super({
      passReqToCallback: true,
    });
  }

  /** Validates a username and password. */
  async validate(
    req: { gamevaultuser: GamevaultUser },
    username: string,
    password: string,
  ) {
    if (
      configuration.TESTING.AUTHENTICATION_DISABLED &&
      (!username || !password)
    ) {
      return true;
    }

    const user = await this.usersService.login(username, password);
    req.gamevaultuser = user;
    return !!user;
  }
}
