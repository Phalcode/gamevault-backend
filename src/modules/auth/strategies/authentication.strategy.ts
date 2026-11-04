import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { AppConfiguration } from "../../../configuration.js";
import { InjectGamevaultConfig } from "../../../decorators/inject-gamevault-config.decorator.js";
import { UsersService } from "../../users/users.service.js";
import { AuthenticationService } from "../authentication.service.js";
import { type GamevaultJwtPayload } from "../models/gamevault-jwt-payload.interface.js";

@Injectable()
export class AuthenticationStrategy extends PassportStrategy(Strategy, "auth") {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthenticationService,
    @InjectGamevaultConfig() private readonly config: AppConfiguration,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.AUTH.ACCESS_TOKEN.SECRET,
      algorithms: ["HS256"],
      ignoreExpiration: false,
    });
  }

  async validate(dto: { payload: GamevaultJwtPayload }) {
    // Optional session binding: tokens issued for a session stop working as
    // soon as that session is revoked. Tokens without a `sid` (issued before
    // the feature was enabled) stay valid until they expire.
    if (
      this.config.AUTH.ACCESS_TOKEN.SESSION_BINDING_ENABLED &&
      dto.payload?.sid
    ) {
      const sessionId = Number(dto.payload.sid);
      if (
        !Number.isFinite(sessionId) ||
        !(await this.authService.isSessionActive(sessionId))
      ) {
        throw new UnauthorizedException(
          "Authentication Failed: Session has been revoked",
        );
      }
    }

    return await this.usersService.findOneByUsernameOrFail(
      (
        await this.usersService.findUserForAuthOrFail({
          id: Number(dto.payload?.sub),
          username: dto.payload?.preferred_username,
          email: dto.payload?.email,
        })
      ).username,
    );
  }
}
