import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { BasicStrategy } from "passport-http";

import { compare, hash } from "bcrypt";
import { GamevaultUser } from "../../users/gamevault-user.entity.js";
import { PASSWORD_HASH_COST, UsersService } from "../../users/users.service.js";

/**
 * Identical message for "unknown user" and "wrong password", so the response
 * cannot be used to enumerate accounts.
 */
const GENERIC_LOGIN_FAILURE =
  "Authentication Failed: Incorrect username or password";

/**
 * Hash that is compared against when no user matches, so a failed login takes
 * the same amount of time regardless of whether the account exists.
 */
const DUMMY_PASSWORD = "gamevault-nonexistent-user-password";
let dummyPasswordHash: Promise<string> | undefined;
function getDummyPasswordHash(): Promise<string> {
  dummyPasswordHash ??= hash(DUMMY_PASSWORD, PASSWORD_HASH_COST);
  return dummyPasswordHash;
}

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
    const user = await this.usersService.findUserForAuth({
      username,
      email: username,
    });

    // Same work for unknown accounts: no user lookup timing difference.
    if (!user?.password) {
      await compare(password, await getDummyPasswordHash());
      throw new UnauthorizedException(GENERIC_LOGIN_FAILURE);
    }

    if (!(await compare(password, user.password))) {
      throw new UnauthorizedException(GENERIC_LOGIN_FAILURE);
    }

    const cleanedUser = await this.usersService.findOneByUsernameOrFail(
      user.username,
    );
    request.user = cleanedUser;
    await this.usersService.rehashPasswordIfNeeded(user, password);
    return cleanedUser;
  }
}
