import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { type Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { AppConfiguration } from "../../../configuration.js";
import { InjectGamevaultConfig } from "../../../decorators/inject-gamevault-config.decorator.js";
import { UsersService } from "../../users/users.service.js";
import { AuthenticationService } from "../authentication.service.js";
import { type GamevaultJwtPayload } from "../models/gamevault-jwt-payload.interface.js";

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  "refresh-token",
) {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthenticationService,
    @InjectGamevaultConfig() config: AppConfiguration,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.AUTH.REFRESH_TOKEN.SECRET,
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  async validate(request: Request, dto: { payload: GamevaultJwtPayload }) {
    // Check if token is revoked
    const token = (request.headers.authorization ?? "").split(" ")[1];
    const isRevoked = await this.authService.isTokenRevoked(token);
    if (isRevoked) {
      throw new UnauthorizedException(
        "Authentication Failed: token has been revoked",
      );
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
