import { Injectable, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import configuration from "../../../configuration";
import { UsersService } from "../../users/users.service";
import { LoginDto } from "../models/login.dto";
@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  "refresh-token",
) {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly userService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configuration.AUTH.REFRESH_TOKEN.SECRET,
      ignoreExpiration: false,
    });
  }

  async validate(dto: LoginDto) {
    return await this.userService.findOneByUserIdOrFail(
      Number(dto.payload.sub),
    );
  }
}
