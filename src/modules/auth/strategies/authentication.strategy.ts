import { Injectable, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import configuration from "../../../configuration";
import { UsersService } from "../../users/users.service";
import { LoginDto } from "../models/login.dto";
@Injectable()
export class AuthenticationStrategy extends PassportStrategy(Strategy, "auth") {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configuration.AUTH.ACCESS_TOKEN.SECRET,
      ignoreExpiration: false,
    });
  }

  async validate(dto: LoginDto) {
    return await this.usersService.findOneByUsernameOrFail(
      (
        await this.usersService.findUserByUsernameForAuthOrFail(
          dto.payload?.preferred_username,
        )
      ).username,
    );
  }
}
