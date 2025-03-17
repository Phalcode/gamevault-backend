import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { Strategy } from "passport-oauth2";
import { UsersService } from "../../users/users.service";
import { AuthProvidersService } from "../auth-providers.service";

@Injectable()
export class DynamicOAuthStrategy extends PassportStrategy(Strategy, "oauth2") {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly authProvidersService: AuthProvidersService,
  ) {
    super({
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: any,
  ) {
    const provider = req.session?.provider;
    if (!provider) {
      throw new UnauthorizedException("No OAuth provider selected.");
    }

    this.logger.log(`Authenticating user with provider: ${provider}`);

    // Retrieve user profile and create a user if necessary
    const user = await this.usersService.findOrCreateOAuthUser(
      profile,
      provider,
    );
    if (!user) {
      throw new UnauthorizedException(
        "OAuth2 user not found or could not be created.",
      );
    }

    return user;
  }
}
