I have a nestjs server with basic auth authentication using passportjs that looks like this:

import { ExecutionContext, Injectable, Logger } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";

import configuration from "../../configuration";

@Injectable()
export class AuthenticationGuard extends AuthGuard("basic") {
private readonly logger = new Logger(this.constructor.name);

constructor(private readonly reflector: Reflector) {
super();
if (configuration.TESTING.AUTHENTICATION_DISABLED) {
this.logger.warn({
message: "Skipping Authentication Checks.",
reason: "TESTING_AUTHENTICATION_DISABLED is set to true.",
});
}
}

/\*_Determines whether the route can be activated._/
canActivate(context: ExecutionContext) {
const isPublic = this.reflector.get<boolean>(
"public",
context.getHandler(),
);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);

}
}

import { Injectable, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { BasicStrategy } from "passport-http";

import configuration from "../../configuration";
import { GamevaultUser } from "../users/gamevault-user.entity";
import { UsersService } from "../users/users.service";

@Injectable()
export class DefaultStrategy extends PassportStrategy(BasicStrategy) {
private readonly logger = new Logger(this.constructor.name);
constructor(private readonly usersService: UsersService) {
super({
passReqToCallback: true,
});
}

/\*_Validates a username and password._/
async validate(
req: { gamevaultuser: GamevaultUser },
username: string,
password: string,
) {
if (
configuration.TESTING.AUTHENTICATION_DISABLED &&
(!username || !password)
) {
return true;
}

    const user = await this.usersService.login(username, password);
    req.gamevaultuser = user;
    return !!user;

}
}

I now have a user that asks for "SSO".

He says:

Cool Project :)

I want to suggest that you also support SSO for user registration and authentication. It gets more and more popular in stacks like Jellyfin (via Plugin), Jellyseerr, \*arr, Portainer, Nextcloud etc.
People often use Authentik, Authelia or Keycloak as software.

A standard - but probably complicated - way of implementing that would be OpenID.

An easy way is to leverage a Proxy Provider.
Using Header authentficiation: <https://goauthentik.io/docs/providers/proxy/header_authentication>
Or better, Forward auth: <https://goauthentik.io/docs/providers/proxy/server_nginx>
With forward auth, authentik will redirect a request to its login page if not authenticated. Your app would have to open up a browser window and save the returned auth cookie, and send this cookie in further requests. When authentificated (via cookie) authentik will send a header with the username to the backend.

Overall, this makes user management of self-hosted apps much easier, especially when having many applications that are shared within the family.

i want to implement Oauth next to my basic auth which is the default. how would i do that, for this selfhosted server. I have setup a keycloak for this. i want to use passport-oauth2. Please give me a full detailed guide.

---

If you want your **self-hosted NestJS app** to support **multiple OAuth2 providers** (e.g., Keycloak, Google, GitHub, Authentik, etc.), you'll need a **dynamic OAuth2 strategy** that allows users to authenticate with **any provider of their choice**.

---

## **Approach**

1. **Modify OAuth strategy** to be flexible.
2. **Allow users to select an OAuth provider** dynamically.
3. **Store provider configurations in the database** or configuration file.
4. **Authenticate dynamically based on the selected provider**.

---

# **Step 1: Install Dependencies**

```sh
npm install passport-oauth2 passport @nestjs/passport
```

---

# **Step 2: Define the OAuth Strategy (Dynamic)**

Create a new file:  
📂 `src/auth/strategies/dynamic-oauth.strategy.ts`

```typescript
import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-oauth2";
import { UsersService } from "../../users/users.service";
import { AuthProvidersService } from "../auth-providers.service";
import { Request } from "express";

@Injectable()
export class DynamicOAuthStrategy extends PassportStrategy(Strategy, "oauth2") {
  private readonly logger = new Logger(this.constructor.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly authProvidersService: AuthProvidersService,
  ) {
    super({
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: any,
  ) {
    const provider = req.session?.provider;
    if (!provider) {
      throw new UnauthorizedException("No OAuth provider selected.");
    }

    this.logger.log(`Authenticating user with provider: ${provider}`);

    // Retrieve user profile and create a user if necessary
    const user = await this.usersService.findOrCreateOAuthUser(
      profile,
      provider,
    );
    if (!user) {
      throw new UnauthorizedException(
        "OAuth2 user not found or could not be created.",
      );
    }

    return user;
  }
}
```

---

# **Step 3: Dynamic OAuth Provider Management**

Create a new file:  
📂 `src/auth/auth-providers.service.ts`

```typescript
import { Injectable } from "@nestjs/common";

@Injectable()
export class AuthProvidersService {
  private providers = {
    keycloak: {
      authorizationURL:
        "http://localhost:8080/realms/myrealm/protocol/openid-connect/auth",
      tokenURL:
        "http://localhost:8080/realms/myrealm/protocol/openid-connect/token",
      clientID: "your-client-id",
      clientSecret: "your-client-secret",
      callbackURL: "http://localhost:3000/auth/oauth2/callback",
    },
    google: {
      authorizationURL: "https://accounts.google.com/o/oauth2/auth",
      tokenURL: "https://oauth2.googleapis.com/token",
      clientID: "your-google-client-id",
      clientSecret: "your-google-client-secret",
      callbackURL: "http://localhost:3000/auth/oauth2/callback",
    },
    github: {
      authorizationURL: "https://github.com/login/oauth/authorize",
      tokenURL: "https://github.com/login/oauth/access_token",
      clientID: "your-github-client-id",
      clientSecret: "your-github-client-secret",
      callbackURL: "http://localhost:3000/auth/oauth2/callback",
    },
  };

  getProviderConfig(provider: string) {
    return this.providers[provider] || null;
  }
}
```

---

# **Step 4: Create Authentication Controller**

Modify 📂 `src/auth/auth.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthProvidersService } from "./auth-providers.service";
import { Request, Response } from "express";
import passport from "passport";

@Controller("auth")
export class AuthController {
  constructor(private readonly authProvidersService: AuthProvidersService) {}

  @Get("oauth2")
  async oauth2Login(
    @Query("provider") provider: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const providerConfig =
      this.authProvidersService.getProviderConfig(provider);
    if (!providerConfig) {
      throw new BadRequestException("Invalid OAuth provider.");
    }

    req.session.provider = provider; // Store provider in session for callback

    passport.authenticate("oauth2", {
      authorizationURL: providerConfig.authorizationURL,
      tokenURL: providerConfig.tokenURL,
      clientID: providerConfig.clientID,
      clientSecret: providerConfig.clientSecret,
      callbackURL: providerConfig.callbackURL,
      scope: ["openid", "profile", "email"],
    })(req, res);
  }

  @Get("oauth2/callback")
  @UseGuards(AuthGuard("oauth2"))
  async oauth2Callback(@Req() req: Request) {
    return req.user;
  }
}
```

---

# **Step 5: Update UsersService**

Modify 📂 `src/users/users.service.ts`:

```typescript
import { Injectable } from "@nestjs/common";
import { GamevaultUser } from "./gamevault-user.entity";

@Injectable()
export class UsersService {
  async login(
    username: string,
    password: string,
  ): Promise<GamevaultUser | null> {
    // Your existing login logic for Basic Auth
  }

  async findOrCreateOAuthUser(
    profile: any,
    provider: string,
  ): Promise<GamevaultUser> {
    let user = await this.findByEmail(profile.email);
    if (!user) {
      user = await this.createUserFromOAuth(profile, provider);
    }
    return user;
  }

  private async findByEmail(email: string): Promise<GamevaultUser | null> {
    // Find user by email in DB
  }

  private async createUserFromOAuth(
    profile: any,
    provider: string,
  ): Promise<GamevaultUser> {
    // Create a new user from OAuth profile data
  }
}
```

---

# **Step 6: Register OAuth in Auth Module**

Modify 📂 `src/auth/auth.module.ts`:

```typescript
import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { AuthenticationGuard } from "./authentication.guard";
import { DynamicOAuthStrategy } from "./strategies/dynamic-oauth.strategy";
import { AuthController } from "./auth.controller";
import { UsersService } from "../users/users.service";
import { AuthProvidersService } from "./auth-providers.service";

@Module({
  imports: [PassportModule.register({ defaultStrategy: "basic" })],
  controllers: [AuthController],
  providers: [
    AuthenticationGuard,
    DynamicOAuthStrategy,
    AuthProvidersService,
    UsersService,
  ],
})
export class AuthModule {}
```

---

# **Step 7: Update Authentication Guard**

Modify 📂 `src/auth/authentication.guard.ts`:

```typescript
import { ExecutionContext, Injectable, Logger } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class AuthenticationGuard extends AuthGuard(["basic", "oauth2"]) {
  private readonly logger = new Logger(this.constructor.name);

  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.get<boolean>(
      "public",
      context.getHandler(),
    );
    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
```

---

# **Step 8: Test the Implementation**

### **Start NestJS**

```sh
npm run start
```

### **Test OAuth with Different Providers**

1. **Google** → `http://localhost:3000/auth/oauth2?provider=google`
2. **GitHub** → `http://localhost:3000/auth/oauth2?provider=github`
3. **Keycloak** → `http://localhost:3000/auth/oauth2?provider=keycloak`

---

# **Conclusion**

✅ **Basic Authentication remains the default**  
✅ **Supports multiple OAuth2 providers dynamically**  
✅ **No hardcoded provider; users can pick any supported one**  
✅ **Easier to extend (add more providers in `auth-providers.service.ts`)**

🚀 Let me know if you need further refinements!
