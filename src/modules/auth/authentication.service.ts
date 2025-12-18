import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { createHash } from "crypto";
import ms, { StringValue } from "ms";
import { LessThan, MoreThan, Repository } from "typeorm";
import configuration from "../../configuration";
import { GamevaultUser } from "../users/gamevault-user.entity";
import { RegisterUserDto } from "../users/models/register-user.dto";
import { UsersService } from "../users/users.service";
import { GamevaultJwtPayload } from "./models/gamevault-jwt-payload.interface";
import { RefreshTokenDto } from "./models/refresh-token.dto";
import { TokenPairDto } from "./models/token-pair.dto";
import { Session } from "./session.entity";

@Injectable()
export class AuthenticationService implements OnModuleInit {
  private readonly logger = new Logger(this.constructor.name);
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  async onModuleInit() {
    await this.cleanupOldSessions();
  }

  private async cleanupOldSessions() {
    const expiryTime = ms(
      configuration.AUTH.REFRESH_TOKEN.EXPIRES_IN as StringValue,
    );
    const cutoffDate = new Date(Date.now() - expiryTime * 3);

    const result = await this.sessionRepository.delete({
      expires_at: LessThan(cutoffDate),
    });

    this.logger.debug({
      message: "Cleaned up expired sessions",
      deletedCount: result.affected,
      cutoffDate,
      expiryTime,
    });
  }

  async login(
    requestUser: GamevaultUser,
    ipAddress: string,
    userAgent: string,
  ): Promise<TokenPairDto> {
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

    const refreshToken = this.jwtService.sign(
      { payload },
      {
        secret: configuration.AUTH.REFRESH_TOKEN.SECRET,
        expiresIn: configuration.AUTH.REFRESH_TOKEN.EXPIRES_IN as StringValue,
      },
    );

    // Create a new session
    const session = new Session();
    session.user = user;
    session.refresh_token_hash = createHash("sha256")
      .update(refreshToken)
      .digest("hex");
    session.expires_at = new Date(
      Date.now() +
        ms(configuration.AUTH.REFRESH_TOKEN.EXPIRES_IN as StringValue),
    );
    session.ip_address = ipAddress;
    session.user_agent = userAgent;
    await this.sessionRepository.save(session);

    const loginDto: TokenPairDto = {
      access_token: this.jwtService.sign({ payload }),
      refresh_token: refreshToken,
    };

    this.logger.debug({
      message: "Created new session",
      session,
    });
    return loginDto;
  }

  async refresh(
    user: GamevaultUser,
    ipAddress: string,
    userAgent: string,
    currentRefreshToken: string,
  ): Promise<TokenPairDto> {
    this.logger.debug(`Refreshing token for user ${user.username}`);

    // Find and update existing session
    const refreshTokenHash = createHash("sha256")
      .update(currentRefreshToken)
      .digest("hex");

    const session = await this.sessionRepository.findOne({
      where: {
        user: { id: user.id },
        refresh_token_hash: refreshTokenHash,
        revoked: false,
        expires_at: MoreThan(new Date()),
      },
    });

    if (!session) {
      throw new BadRequestException("Invalid or expired refresh token");
    }

    // Generate new tokens
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

    const newRefreshToken = this.jwtService.sign(
      { payload },
      {
        secret: configuration.AUTH.REFRESH_TOKEN.SECRET,
        expiresIn: configuration.AUTH.REFRESH_TOKEN.EXPIRES_IN as StringValue,
      },
    );

    // Update session with new refresh token
    session.refresh_token_hash = createHash("sha256")
      .update(newRefreshToken)
      .digest("hex");
    session.expires_at = new Date(
      Date.now() +
        ms(configuration.AUTH.REFRESH_TOKEN.EXPIRES_IN as StringValue),
    );
    await this.sessionRepository.save(session);

    return {
      access_token: this.jwtService.sign({ payload }),
      refresh_token: newRefreshToken,
    };
  }

  async register(dto: RegisterUserDto): Promise<GamevaultUser> {
    return this.usersService.register(dto);
  }

  async revoke(dto: RefreshTokenDto) {
    if (!dto.refresh_token) {
      throw new BadRequestException("No refresh token provided");
    }

    const refreshTokenHash = createHash("sha256")
      .update(dto.refresh_token)
      .digest("hex");

    // Find and mark the session as revoked
    const session = await this.sessionRepository.findOne({
      where: {
        refresh_token_hash: refreshTokenHash,
        revoked: false,
      },
    });

    if (session) {
      session.revoked = true;
      await this.sessionRepository.save(session);
      this.logger.debug({
        message: "Session revoked successfully",
        session_id: session.id,
      });
      return;
    }
    this.logger.warn({
      message: "Attempted to revoke non-existent or already revoked session",
    });
  }

  async isTokenRevoked(refreshToken: string): Promise<boolean> {
    const refreshTokenHash = createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const session = await this.sessionRepository.findOne({
      where: {
        refresh_token_hash: refreshTokenHash,
        revoked: false,
        expires_at: MoreThan(new Date()),
      },
    });
    return !session;
  }

  async getUserSessions(user: GamevaultUser): Promise<Session[]> {
    return this.sessionRepository.find({
      where: {
        user: { id: user.id },
        revoked: false,
        expires_at: MoreThan(new Date()),
      },
      order: {
        created_at: "DESC",
      },
    });
  }

  async revokeAllUserSessions(user: GamevaultUser): Promise<void> {
    await this.sessionRepository.update(
      {
        user: { id: user.id },
        revoked: false,
        expires_at: MoreThan(new Date()),
      },
      {
        revoked: true,
      },
    );
    this.logger.debug({
      message: "All active sessions revoked for user",
      user_id: user.id,
    });
  }
}
