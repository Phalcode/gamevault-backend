import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import configuration from "../../configuration";
import { UsersModule } from "../users/users.module";
import { AuthenticationService } from "./authentication.service";
import { GamevaultJwtController } from "./controllers/authentication.controller";
import { BasicAuthController } from "./controllers/basic-auth.controller";
import { OAuth2Controller } from "./controllers/oauth2.controller";
import { AuthenticationGuard } from "./guards/authentication.guard";
import { AuthorizationGuard } from "./guards/authorization.guard";
import { AuthenticationStrategy } from "./strategies/authentication.strategy";
import { BasicAuthenticationStrategy as BasicAuthStrategy } from "./strategies/basic-auth.strategy";
import { OAuth2Strategy } from "./strategies/oauth2.strategy";
import { RefreshTokenStrategy } from "./strategies/refresh-token.strategy";

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: configuration.AUTH.ACCESS_TOKEN.SECRET,
      signOptions: {
        expiresIn: configuration.AUTH.ACCESS_TOKEN.EXPIRES_IN,
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
