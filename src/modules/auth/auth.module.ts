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
import { BasicAuthenticationStrategy } from "./strategies/basic-auth.strategy";
import { OAuth2Strategy } from "./strategies/oauth2.strategy";
import { RefreshAuthenticationStrategy } from "./strategies/refresh-authentication.strategy";

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: configuration.AUTH.JWT.ACCESS_TOKEN.SECRET,
      signOptions: {
        expiresIn: configuration.AUTH.JWT.ACCESS_TOKEN.EXPIRES_IN,
      },
    }),
  ],
  controllers: [BasicAuthController, OAuth2Controller, GamevaultJwtController],
  providers: [
    AuthenticationStrategy,
    RefreshAuthenticationStrategy,
    AuthenticationService,
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AuthorizationGuard,
    },
    BasicAuthenticationStrategy,
    OAuth2Strategy,
  ],
  exports: [AuthenticationService],
})
export class AuthModule {}
