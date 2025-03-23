import { Injectable, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import configuration from "../../configuration";
import { GamevaultUser } from "../users/gamevault-user.entity";
import { RegisterUserDto } from "../users/models/register-user.dto";
import { UsersService } from "../users/users.service";
import { GamevaultJwt } from "./models/gamevault-jwt.interface";
import { LoginDto } from "./models/login.dto";

@Injectable()
export class AuthenticationService {
  private readonly logger = new Logger(this.constructor.name);
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(requestUser: GamevaultUser): Promise<LoginDto> {
    const user = await this.usersService.findOneByUsernameOrFail(
      requestUser.username,
    );

    const payload: GamevaultJwt = {
      sub: user.id.toString(),
      name: [user.first_name, user.last_name].filter(Boolean).join(" ") || null,
      given_name: user.first_name,
      family_name: user.last_name,
      preferred_username: user.username,
      email: user.email,
      role: user.role.toString(),
      birthdate: user.birth_date?.toISOString(),
    };

    const loginDto: LoginDto = {
      id: payload.sub,
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
      token_expires_in: configuration.AUTH.ACCESS_TOKEN.EXPIRES_IN,
    });
    return loginDto;
  }

  async refresh(user: GamevaultUser): Promise<LoginDto> {
    this.logger.debug(`Refreshing token for user ${user.username}`);
    const loginDto = await this.login(user);
    delete loginDto.refresh_token;
    return loginDto;
  }

  async register(dto: RegisterUserDto): Promise<GamevaultUser> {
    return this.usersService.register(dto);
  }

  async logout() {
    /* TODO Implement logout */
  }
}
