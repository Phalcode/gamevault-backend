import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StringValue } from "ms";
import configuration from "../../configuration.js";
import { UsersModule } from "../users/users.module.js";
import { AuthenticationService } from "./authentication.service.js";
import { GamevaultJwtController } from "./controllers/authentication.controller.js";
import { BasicAuthController } from "./controllers/basic-auth.controller.js";
import { OAuth2Controller } from "./controllers/oauth2.controller.js";
import { ApiKeyGuard } from "./guards/api-key.guard.js";
import { AuthenticationGuard } from "./guards/authentication.guard.js";
import { AuthorizationGuard } from "./guards/authorization.guard.js";
import { Session } from "./session.entity.js";
import { AuthenticationStrategy } from "./strategies/authentication.strategy.js";
import { BasicAuthenticationStrategy as BasicAuthStrategy } from "./strategies/basic-auth.strategy.js";
import { OAuth2Strategy } from "./strategies/oauth2.strategy.js";
import { RefreshTokenStrategy } from "./strategies/refresh-token.strategy.js";

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([Session]),
    JwtModule.register({
      global: true,
      secret: configuration.AUTH.ACCESS_TOKEN.SECRET,
      signOptions: {
        expiresIn: configuration.AUTH.ACCESS_TOKEN.EXPIRES_IN as StringValue,
      },
    }),
  ],
  controllers: [
    BasicAuthController,
    GamevaultJwtController,
    ...(configuration.AUTH.BASIC_AUTH.ENABLED ? [BasicAuthController] : []),
    ...(configuration.AUTH.OAUTH2.ENABLED ? [OAuth2Controller] : []),
  ],
  providers: [
    AuthenticationStrategy,
    RefreshTokenStrategy,
    AuthenticationService,

    ...(configuration.AUTH.API_KEY.ENABLED
      ? [
          {
            provide: APP_GUARD,
            useClass: ApiKeyGuard,
          },
        ]
      : []),

    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AuthorizationGuard,
    },
    ...(configuration.AUTH.BASIC_AUTH.ENABLED ? [BasicAuthStrategy] : []),
    ...(configuration.AUTH.OAUTH2.ENABLED ? [OAuth2Strategy] : []),
  ],
  exports: [AuthenticationService],
})
export class AuthModule {}
