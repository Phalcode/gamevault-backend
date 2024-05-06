import { Injectable, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { BasicStrategy } from "passport-http";

import { GamevaultUser } from "../users/gamevault-user.entity";
import { UsersService } from "../users/users.service";

@Injectable()
export class DefaultStrategy extends PassportStrategy(BasicStrategy) {
  private readonly logger = new Logger(DefaultStrategy.name);
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
    const user = await this.usersService.login(username, password);
    req.gamevaultuser = user;
    return !!user;
  }
}
