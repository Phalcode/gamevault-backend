import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PassportStrategy } from "@nestjs/passport";
import { randomBytes } from "crypto";
import { VerifiedCallback } from "passport-jwt";
import { Strategy } from "passport-oauth2";
import configuration from "../../../configuration";
import { GamevaultUser } from "../../users/gamevault-user.entity";
import { UsersService } from "../../users/users.service";
import OAuth2UserProfile from "../models/oauth2-user-profile.interface";
import PassportUserProfile from "../models/passport-user-profile.interface";

@Injectable()
export class OAuth2Strategy extends PassportStrategy(Strategy, "oauth2", 6) {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {
    if (
      !configuration.AUTH.OAUTH2.AUTH_URL ||
      !configuration.AUTH.OAUTH2.TOKEN_URL ||
      !configuration.AUTH.OAUTH2.CALLBACK_URL ||
      !configuration.AUTH.OAUTH2.CLIENT_ID ||
      !configuration.AUTH.OAUTH2.CLIENT_SECRET
    ) {
      throw new BadRequestException(
        "Failed to initialize OAuth2Strategy. Please configure all necessary options.",
      );
    }

    super({
      passReqToCallback: true,
      authorizationURL: configuration.AUTH.OAUTH2.AUTH_URL,
      tokenURL: configuration.AUTH.OAUTH2.TOKEN_URL,
      clientID: configuration.AUTH.OAUTH2.CLIENT_ID,
      clientSecret: configuration.AUTH.OAUTH2.CLIENT_SECRET,
      callbackURL: configuration.AUTH.OAUTH2.CALLBACK_URL,
      scope: configuration.AUTH.OAUTH2.SCOPES,
    });
  }

  private extractProfile(
    accessToken: string,
    passportProfile: PassportUserProfile,
  ): OAuth2UserProfile {
    const token = this.jwtService.decode(accessToken);
    return {
      id: passportProfile.id || token["sub"],
      username:
        passportProfile.displayName ||
        token["nickname"] ||
        token["preferred_username"] ||
        `GameVaultUser${Math.floor(1000 + Math.random() * 9000)}`,
      email: passportProfile.emails?.[0]?.value || token["email"],
      first_name: passportProfile.name?.givenName || token["given_name"],
      last_name: passportProfile.name?.familyName || token["family_name"],
      birthdate: passportProfile.birthdate || token["birthdate"],
    };
  }

  private validateProfile(profile: OAuth2UserProfile) {
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
      throw new UnauthorizedException(
        `${missingFields.join(", ")} is required for authentication, but was not provided by the identity provider.`,
      );
    }
    return profile;
  }

  async validate(
    req: { user: GamevaultUser },
    accessToken: string,
    refreshToken: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    profile: any,
    done: VerifiedCallback,
  ) {
    // If ID token is provided, use it instead
    if (params.id_token) {
      accessToken = params.id_token;
    }

    this.logger.debug({
      message: "Received OAuth2 Callback.",
      user: req.user,
      token_endpoint_response: params,
      profile,
    });

    if (!accessToken || !profile) {
      this.logger.error({
        message:
          "Authentication Failed: Identity provider did not return all required data for authentication.",
        user: req.user,
        accessToken,
        refreshToken,
        passportProfile: profile,
      });
      throw new UnauthorizedException(
        "Authentication Failed: Identity provider did not return all required data for authentication.",
      );
    }

    const validatedProfile = this.validateProfile(
      this.extractProfile(accessToken, profile),
    );

    //TODO: This should look for token.sub instead of username/email as these are not guaranteed to not change
    let cleanedUser = await this.usersService
      .findUserByUsernameForAuthOrFail(
        validatedProfile.username,
        validatedProfile.email,
      )
      .then((user) => this.usersService.findOneByUsernameOrFail(user.username))
      .catch(() => null);

    if (cleanedUser) {
      this.logger.debug({
        message: "OAuth2 User was found in database.",
        profile: validatedProfile,
      });
    } else {
      this.logger.debug({
        message: "OAuth2 User not found in database. Registering new...",
        profile: validatedProfile,
      });
      cleanedUser = await this.usersService.register({
        username: validatedProfile.username,
        email: validatedProfile.email,
        first_name: validatedProfile.first_name,
        last_name: validatedProfile.last_name,
        password: randomBytes(24).toString("base64").slice(0, 32),
      });
    }
    req.user = cleanedUser;
    done(null, cleanedUser);
  }
}
