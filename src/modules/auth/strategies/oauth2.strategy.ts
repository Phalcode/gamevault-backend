import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PassportStrategy } from "@nestjs/passport";
import { randomBytes } from "crypto";
import { Strategy, VerifyCallback } from "passport-oauth2";
import configuration from "../../../configuration";
import { GamevaultUser } from "../../users/gamevault-user.entity";
import { UsersService } from "../../users/users.service";
import OAuth2UserProfile from "../models/oauth2-user-profile.interface";

@Injectable()
export class OAuth2Strategy extends PassportStrategy(Strategy, "oauth2") {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {
    if (
      !configuration.AUTH.OAUTH.AUTH_URL ||
      !configuration.AUTH.OAUTH.TOKEN_URL ||
      !configuration.AUTH.OAUTH.CLIENT_ID ||
      !configuration.AUTH.OAUTH.CLIENT_SECRET ||
      !configuration.AUTH.OAUTH.CALLBACK_URL
    ) {
      throw new BadRequestException(
        "Failed to initialize OAuth2Strategy. Please configure all necessary options.",
      );
    }

    // TODO: should be loaded depending on configuration
    super({
      passReqToCallback: true,
      authorizationURL: configuration.AUTH.OAUTH.AUTH_URL,
      tokenURL: configuration.AUTH.OAUTH.TOKEN_URL,
      clientID: configuration.AUTH.OAUTH.CLIENT_ID,
      clientSecret: configuration.AUTH.OAUTH.CLIENT_SECRET,
      callbackURL: configuration.AUTH.OAUTH.CALLBACK_URL,
      scope: ["openid", "email", "profile"],
    });
  }

  private extractProfile(
    accessToken: string,
    passportProfile: any,
  ): OAuth2UserProfile {
    const token = this.jwtService.decode(accessToken);
    return {
      id: passportProfile.id || token["sub"],
      username:
        passportProfile.username ||
        token["nickname"] ||
        token["preferred_username"],
      email: passportProfile.emails?.[0]?.value || token["email"],
      first_name: passportProfile.name?.givenName || token["given_name"],
      last_name: passportProfile.name?.familyName || token["family_name"],
      birthdate: passportProfile.birthdate || token["birthdate"],
    };
  }

  private validateProfile(profile: OAuth2UserProfile, done: VerifyCallback) {
    const missingFields = [];

    if (!profile.username) missingFields.push("Username");
    if (configuration.USERS.REQUIRE_EMAIL && !profile.email)
      missingFields.push("Email");
    if (configuration.USERS.REQUIRE_FIRST_NAME && !profile.first_name)
      missingFields.push("First Name");
    if (configuration.USERS.REQUIRE_LAST_NAME && !profile.last_name)
      missingFields.push("Last Name");

    if (missingFields.length > 0) {
      this.logger.error({
        message:
          "Authentication Failed: User profile is missing required fields",
        missingFields,
        profile,
      });
      return done(
        `${missingFields.join(", ")} is required for authentication, but was not provided by the identity provider.`,
        false,
      );
    }
    return true;
  }

  async validate(
    req: { user: GamevaultUser },
    accessToken: string,
    refreshToken: string,
    passportProfile: any,
    done: VerifyCallback,
  ) {
    const profile = this.extractProfile(accessToken, passportProfile);

    if (!this.validateProfile(profile, done)) return;

    req.user = await this.userService
      .findOneByUsernameOrFail(profile.username)
      .catch(() => null);

    if (!req.user) {
      req.user = await this.userService.register({
        username: profile.username,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        password: randomBytes(24).toString("base64").slice(0, 32),
      });
    }
    done(null, req.user);
  }
}
