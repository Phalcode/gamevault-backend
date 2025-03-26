import { Injectable, Logger, NotImplementedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import configuration from "../../configuration";
import { GamevaultUser } from "../users/gamevault-user.entity";
import { RegisterUserDto } from "../users/models/register-user.dto";
import { UsersService } from "../users/users.service";
import { GamevaultJwtPayload } from "./models/gamevault-jwt-payload.interface";
import { RefreshTokenDto } from "./models/refresh-token.dto";
import { TokenPairDto } from "./models/token-pair.dto";

@Injectable()
export class AuthenticationService {
  private readonly logger = new Logger(this.constructor.name);
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(requestUser: GamevaultUser): Promise<TokenPairDto> {
    const user = await this.usersService.findOneByUsernameOrFail(
      requestUser.username,
    );

    const payload: GamevaultJwtPayload = {
      sub: user.id.toString(),
      name: [user.first_name, user.last_name].filter(Boolean).join(" ") || null,
      given_name: user.first_name,
      family_name: user.last_name,
      preferred_username: user.username,
      email: user.email,
      role: user.role.toString(),
      birthdate: user.birth_date?.toISOString(),
    };

    const loginDto: TokenPairDto = {
      access_token: this.jwtService.sign({ payload }),
      refresh_token: this.jwtService.sign(
        { payload },
        {
          secret: configuration.AUTH.REFRESH_TOKEN.SECRET,
          expiresIn: configuration.AUTH.REFRESH_TOKEN.EXPIRES_IN,
        },
      ),
    };

    this.logger.debug({
      message: `Issued token for user ${requestUser.username}`,
      token_payload: payload,
      access_token_expires_in: configuration.AUTH.ACCESS_TOKEN.EXPIRES_IN,
      refresh_token_expires_in: configuration.AUTH.REFRESH_TOKEN.EXPIRES_IN,
    });
    return loginDto;
  }

  async refresh(user: GamevaultUser): Promise<TokenPairDto> {
    this.logger.debug(`Refreshing token for user ${user.username}`);
    return await this.login(user);
  }

  async register(dto: RegisterUserDto): Promise<GamevaultUser> {
    return this.usersService.register(dto);
  }

  async revoke(dto: RefreshTokenDto) {
    //TODO: Implement token revocation
    throw new NotImplementedException(
      dto,
      "Revoking tokens is not implemented yet.",
    );
  }
}
