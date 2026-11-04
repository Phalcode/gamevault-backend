import { UnauthorizedException } from "@nestjs/common";
import { hash } from "bcrypt";
import { type GamevaultUser } from "../../users/gamevault-user.entity.js";
import { UsersService } from "../../users/users.service.js";
import { BasicAuthenticationStrategy } from "./basic-auth.strategy.js";

const PASSWORD = "correct-horse-battery";
const GENERIC_MESSAGE = "Authentication Failed: Incorrect username or password";

function createUser(overrides: Partial<GamevaultUser> = {}): GamevaultUser {
  return {
    id: 1,
    username: "alice",
    email: "alice@example.com",
    activated: true,
    role: 0,
    ...overrides,
  } as unknown as GamevaultUser;
}

describe("BasicAuthenticationStrategy", () => {
  let usersService: {
    findUserForAuth: ReturnType<typeof vi.fn>;
    findOneByUsernameOrFail: ReturnType<typeof vi.fn>;
    rehashPasswordIfNeeded: ReturnType<typeof vi.fn>;
  };
  let strategy: BasicAuthenticationStrategy;

  beforeEach(() => {
    usersService = {
      findUserForAuth: vi.fn(),
      findOneByUsernameOrFail: vi.fn(),
      rehashPasswordIfNeeded: vi.fn().mockResolvedValue(undefined),
    };
    strategy = new BasicAuthenticationStrategy(
      usersService as unknown as UsersService,
    );
  });

  it("rejects an unknown user with the generic message", async () => {
    usersService.findUserForAuth.mockResolvedValue(null);

    await expect(
      strategy.validate({} as { user: GamevaultUser }, "alice", PASSWORD),
    ).rejects.toThrow(new UnauthorizedException(GENERIC_MESSAGE));
    expect(usersService.findOneByUsernameOrFail).not.toHaveBeenCalled();
    expect(usersService.rehashPasswordIfNeeded).not.toHaveBeenCalled();
  });

  it("rejects a user without a password with the generic message", async () => {
    usersService.findUserForAuth.mockResolvedValue(
      createUser({ password: undefined }),
    );

    await expect(
      strategy.validate({} as { user: GamevaultUser }, "alice", PASSWORD),
    ).rejects.toThrow(new UnauthorizedException(GENERIC_MESSAGE));
  });

  it("rejects a wrong password with the generic message", async () => {
    usersService.findUserForAuth.mockResolvedValue(
      createUser({ password: await hash("something-else", 4) }),
    );

    await expect(
      strategy.validate({} as { user: GamevaultUser }, "alice", PASSWORD),
    ).rejects.toThrow(new UnauthorizedException(GENERIC_MESSAGE));
    expect(usersService.findOneByUsernameOrFail).not.toHaveBeenCalled();
  });

  it("accepts the correct password, attaches the user and upgrades the hash", async () => {
    const storedUser = createUser({ password: await hash(PASSWORD, 4) });
    const cleanedUser = createUser();
    usersService.findUserForAuth.mockResolvedValue(storedUser);
    usersService.findOneByUsernameOrFail.mockResolvedValue(cleanedUser);

    const request = {} as { user: GamevaultUser };

    await expect(strategy.validate(request, "alice", PASSWORD)).resolves.toBe(
      cleanedUser,
    );
    expect(usersService.findOneByUsernameOrFail).toHaveBeenCalledWith("alice");
    expect(request.user).toBe(cleanedUser);
    expect(usersService.rehashPasswordIfNeeded).toHaveBeenCalledWith(
      storedUser,
      PASSWORD,
    );
  });
});
