import { NotAcceptableException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { AppConfiguration } from "../../../configuration.js";
import { GamevaultUser } from "../../users/gamevault-user.entity.js";
import { Role } from "../../users/models/role.enum.js";
import { UsersService } from "../../users/users.service.js";
import { OAuth2Strategy } from "./oauth2.strategy.js";

function buildConfig(): AppConfiguration {
  return {
    AUTH: {
      OAUTH2: {
        AUTH_URL: "https://idp.example.com/authorize",
        TOKEN_URL: "https://idp.example.com/token",
        CALLBACK_URL: "https://gamevault.example.com/api/auth/oauth2/login",
        CLIENT_ID: "client-id",
        CLIENT_SECRET: "client-secret",
        SCOPES: ["openid", "profile", "email"],
        USERINFO_URL: undefined,
      },
    },
    USERS: {
      REQUIRE_EMAIL: false,
      REQUIRE_FIRST_NAME: false,
      REQUIRE_LAST_NAME: false,
    },
  } as unknown as AppConfiguration;
}

function createUser(overrides: Partial<GamevaultUser> = {}): GamevaultUser {
  const user = new GamevaultUser();
  user.id = 1;
  user.username = "testuser";
  user.email = "test@example.com";
  user.activated = true;
  user.role = Role.USER;
  Object.assign(user, overrides);
  return user;
}

describe("OAuth2Strategy", () => {
  let usersService: {
    findUserForAuth: ReturnType<typeof vi.fn>;
    findOneByUsernameOrFail: ReturnType<typeof vi.fn>;
    register: ReturnType<typeof vi.fn>;
    assertUserCanAuthenticate: (user: GamevaultUser) => void;
  };
  let strategy: OAuth2Strategy;

  beforeEach(() => {
    usersService = {
      findUserForAuth: vi.fn(),
      findOneByUsernameOrFail: vi.fn(),
      register: vi.fn(),
      assertUserCanAuthenticate: (user) =>
        UsersService.prototype.assertUserCanAuthenticate(user),
    };

    const jwtService = {
      decode: vi.fn().mockReturnValue({
        sub: "idp-user-id",
        preferred_username: "testuser",
        email: "test@example.com",
      }),
    };

    strategy = new OAuth2Strategy(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
      buildConfig(),
    );
  });

  async function runValidate() {
    const done = vi.fn();
    await strategy.validate(
      { user: undefined as unknown as GamevaultUser },
      "access-token",
      "refresh-token",
      {},
      {},
      done,
    );
    return done;
  }

  it("logs in an existing user", async () => {
    const user = createUser();
    usersService.findUserForAuth.mockResolvedValue(createUser());
    usersService.findOneByUsernameOrFail.mockResolvedValue(user);

    const done = await runValidate();

    expect(usersService.register).not.toHaveBeenCalled();
    expect(done).toHaveBeenCalledWith(null, user);
  });

  it("surfaces the activation error of an existing user instead of registering a duplicate", async () => {
    usersService.findUserForAuth.mockRejectedValue(
      new NotAcceptableException(
        "Authorization Failed: User is not activated.",
      ),
    );

    await expect(runValidate()).rejects.toBeInstanceOf(NotAcceptableException);
    expect(usersService.register).not.toHaveBeenCalled();
  });

  it("surfaces the deleted-user error instead of registering a duplicate", async () => {
    usersService.findUserForAuth.mockRejectedValue(
      new UnauthorizedException(
        "Authentication Failed: User has been deleted.",
      ),
    );

    await expect(runValidate()).rejects.toThrow("User has been deleted");
    expect(usersService.register).not.toHaveBeenCalled();
  });

  it("registers a new user", async () => {
    const user = createUser();
    usersService.findUserForAuth.mockResolvedValue(null);
    usersService.register.mockResolvedValue(user);

    const done = await runValidate();

    expect(usersService.register).toHaveBeenCalledWith(
      expect.objectContaining({
        username: "testuser",
        email: "test@example.com",
      }),
    );
    expect(done).toHaveBeenCalledWith(null, user);
  });

  it("refuses a newly registered user that still needs activation", async () => {
    usersService.findUserForAuth.mockResolvedValue(null);
    usersService.register.mockResolvedValue(
      createUser({ activated: false, role: Role.USER }),
    );

    await expect(runValidate()).rejects.toBeInstanceOf(NotAcceptableException);
    expect(usersService.register).toHaveBeenCalled();
  });
});
