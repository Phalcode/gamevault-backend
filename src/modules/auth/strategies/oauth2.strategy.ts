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
import { OidcUserInfo } from "../models/oidc-user-info.interface";
import PassportUserProfile from "../models/passport-user-profile.interface";

@Injectable()
export class OAuth2Strategy extends PassportStrategy(Strategy, "oauth2", 6) {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {
    const { AUTH } = configuration;
    if (
      !AUTH.OAUTH2.AUTH_URL ||
      !AUTH.OAUTH2.TOKEN_URL ||
      !AUTH.OAUTH2.CALLBACK_URL ||
      !AUTH.OAUTH2.CLIENT_ID ||
      !AUTH.OAUTH2.CLIENT_SECRET
    ) {
      throw new BadRequestException(
        "Failed to initialize OAuth2Strategy. Please configure all necessary options.",
      );
    }
    super({
      passReqToCallback: true,
      authorizationURL: AUTH.OAUTH2.AUTH_URL,
      tokenURL: AUTH.OAUTH2.TOKEN_URL,
      clientID: AUTH.OAUTH2.CLIENT_ID,
      clientSecret: AUTH.OAUTH2.CLIENT_SECRET,
      callbackURL: AUTH.OAUTH2.CALLBACK_URL,
      scope: AUTH.OAUTH2.SCOPES,
      state: true,
    });
  }

  /**
   * Optionally fetches user info from the OIDC UserInfo endpoint.
   * Returns null if no endpoint is configured or the request fails.
   */
  private async fetchUserInfo(
    accessToken: string,
  ): Promise<Partial<PassportUserProfile>> {
    const userInfoUrl = configuration.AUTH.OAUTH2.USERINFO_URL;
    if (!userInfoUrl) {
      return {};
    }
    try {
      const response = await fetch(userInfoUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        this.logger.warn(
          `Failed to fetch user info: ${response.status} ${response.statusText}`,
        );
        return {};
      }

      const userInfo: OidcUserInfo = await response.json();

      return this.convertOidcUserInfoToPassportProfile(userInfo);
    } catch (error) {
      this.logger.warn(
        `Failed to fetch user info: ${(error as Error).message}`,
      );
      return {};
    }
  }

  private convertOidcUserInfoToPassportProfile(
    oidcUserInfo: OidcUserInfo,
  ): Partial<PassportUserProfile> {
    if (!oidcUserInfo) return {};
    return {
      id: oidcUserInfo.sub,
      birthdate: oidcUserInfo.birthdate,
      preferred_username: oidcUserInfo.preferred_username,
      displayName: oidcUserInfo.preferred_username,
      name: {
        givenName: oidcUserInfo.given_name,
        familyName: oidcUserInfo.family_name,
      },
      emails: oidcUserInfo.email ? [{ value: oidcUserInfo.email }] : undefined,
    };
  }

  /**
   * Validates that the required fields are present.
   * Throws an exception if any required fields are missing.
   */
  private validateProfile(profile: PassportUserProfile): PassportUserProfile {
    const missingFields: string[] = [];
    if (!profile.id) missingFields.push("sub");
    if (!profile.preferred_username) missingFields.push("username");
    if (configuration.USERS.REQUIRE_EMAIL && !profile.emails?.length)
      missingFields.push("email");
    if (configuration.USERS.REQUIRE_FIRST_NAME && !profile.name?.givenName)
      missingFields.push("given_name");
    if (configuration.USERS.REQUIRE_LAST_NAME && !profile.name?.familyName)
      missingFields.push("family_name");

    if (missingFields.length > 0) {
      this.logger.error({
        message: "Authentication Failed: Required fields are missing",
        missingFields,
        profile,
      });
      throw new UnauthorizedException(
        `Authentication Failed: Your identity provider did not provide all required fields to complete your registration. Missing fields: ${missingFields.join(", ")}.`,
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
    this.logger.debug({
      message: "Received OAuth2 callback.",
      user: req.user,
      token_endpoint_response: params,
      profile,
    });

    if (!accessToken || !profile) {
      this.logger.error({
        message: "Authentication Failed: Missing access token or profile.",
        user: req.user,
        accessToken,
        refreshToken,
        passportProfile: profile,
      });
      throw new UnauthorizedException(
        "Authentication Failed: Missing access token or profile from the identity provider.",
      );
    }

    // 1) Retrieve additional user info if available.

    const profileFromAccessToken: Partial<PassportUserProfile> =
      this.convertOidcUserInfoToPassportProfile(
        this.jwtService.decode(accessToken),
      );

    const profileFromIdToken: Partial<PassportUserProfile> = params.id_token
      ? this.convertOidcUserInfoToPassportProfile(
          this.jwtService.decode(params.id_token),
        )
      : {};

    const profileFromUserInfoEndpoint: Partial<PassportUserProfile> =
      await this.fetchUserInfo(accessToken);

    // 2) Merge the Passport profile with additional identity data from trusted sources.
    // Priority order (low → high):
    // 1. profile (lowest priority fallback)
    // 2. profileFromAccessToken (API-level claims, not ideal for identity)
    // 3. profileFromUserInfoEndpoint (fresh but unsigned)
    // 4. profileFromIdToken (signed, trusted, OIDC-compliant)

    const mergedProfile: PassportUserProfile = {
      // Merge in order of increasing trust — later sources override earlier ones
      ...profile, // Least trusted
      ...profileFromAccessToken, // Semi-trusted
      ...profileFromUserInfoEndpoint, // Fresh, but not signed
      ...profileFromIdToken, // Most trusted (signed token)

      // Prioritize email explicitly using nullish coalescing
      emails:
        profileFromIdToken.emails ??
        profileFromUserInfoEndpoint.emails ??
        profileFromAccessToken.emails ??
        profile.emails,

      // Merge nested `name` field in the same priority order
      name: {
        ...profile.name,
        ...profileFromAccessToken.name,
        ...profileFromUserInfoEndpoint.name,
        ...profileFromIdToken.name,
      },
    };

    if (!mergedProfile.preferred_username) {
      // This username is a fallback default and can be overwritten by later spreads
      mergedProfile.preferred_username = `GameVaultUser${Math.floor(1000 + Math.random() * 9000)}`;
      this.logger.warn({
        message:
          "Generated a random username for the user, because none was provided by the identity provider.",
        username: mergedProfile.preferred_username,
      });
    }

    this.logger.debug({
      message: "Merged all available profile information.",
      "1_profile": profile,
      "2_from_access_token": profileFromAccessToken,
      "3_from_user_info_endpoint": profileFromUserInfoEndpoint,
      "4_from_id_token": profileFromIdToken,
      mergedProfile,
    });

    // 3) Validate the profile
    const validatedProfile: PassportUserProfile =
      this.validateProfile(mergedProfile);

    // 4) Look up the user in the database or register a new user.
    let user = await this.usersService
      .findUserForAuthOrFail({
        username: validatedProfile.preferred_username,
        email: validatedProfile.emails[0]?.value,
        idp_id: validatedProfile.id,
      })
      .then((user) => this.usersService.findOneByUsernameOrFail(user.username))
      .catch(() => null);

    if (user) {
      this.logger.debug({
        message: "OAuth2 user found in database.",
        profile: validatedProfile,
      });
    } else {
      this.logger.debug({
        message: "OAuth2 user not found in database. Registering new user...",
        profile: validatedProfile,
      });

      const birth_date = validatedProfile.birthdate
        ? new Date(validatedProfile.birthdate)?.toISOString()
        : null;

      user = await this.usersService.register({
        username: validatedProfile.preferred_username,
        email: validatedProfile.emails[0]?.value,
        first_name: validatedProfile.name?.givenName,
        last_name: validatedProfile.name?.familyName,
        password: randomBytes(24).toString("base64").slice(0, 32),
        birth_date,
        // TODO: We could also store the idp_id in the database to make it possible to find users if they changed their email address.
      });
    }

    req.user = user;
    done(null, user);
  }
}
