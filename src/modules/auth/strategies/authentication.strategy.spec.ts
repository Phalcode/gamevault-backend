import { UnauthorizedException } from "@nestjs/common";
import type { AppConfiguration } from "../../../configuration.js";
import { type GamevaultUser } from "../../users/gamevault-user.entity.js";
import { UsersService } from "../../users/users.service.js";
import { AuthenticationService } from "../authentication.service.js";
import { AuthenticationStrategy } from "./authentication.strategy.js";

function buildConfig(sessionBindingEnabled: boolean): AppConfiguration {
  return {
    AUTH: {
      ACCESS_TOKEN: {
        SECRET: "test-secret",
        SESSION_BINDING_ENABLED: sessionBindingEnabled,
      },
    },
  } as unknown as AppConfiguration;
}

function buildPayload(sid?: string) {
  return {
    sub: "1",
    name: "Alice",
    given_name: "Alice",
    family_name: "",
    preferred_username: "alice",
    email: "alice@example.com",
    birthdate: "",
    role: "0",
    sid,
  };
}

describe("AuthenticationStrategy", () => {
  let usersService: {
    findUserForAuthOrFail: ReturnType<typeof vi.fn>;
    findOneByUsernameOrFail: ReturnType<typeof vi.fn>;
  };
  let authService: { isSessionActive: ReturnType<typeof vi.fn> };
  const user = { id: 1, username: "alice" } as GamevaultUser;

  beforeEach(() => {
    usersService = {
      findUserForAuthOrFail: vi.fn().mockResolvedValue(user),
      findOneByUsernameOrFail: vi.fn().mockResolvedValue(user),
    };
    authService = { isSessionActive: vi.fn().mockResolvedValue(true) };
  });

  function buildStrategy(sessionBindingEnabled: boolean) {
    return new AuthenticationStrategy(
      usersService as unknown as UsersService,
      authService as unknown as AuthenticationService,
      buildConfig(sessionBindingEnabled),
    );
  }

  it("does not check the session while binding is disabled", async () => {
    const strategy = buildStrategy(false);

    await expect(
      strategy.validate({ payload: buildPayload("42") }),
    ).resolves.toBe(user);
    expect(authService.isSessionActive).not.toHaveBeenCalled();
  });

  it("accepts tokens of an active session", async () => {
    const strategy = buildStrategy(true);

    await expect(
      strategy.validate({ payload: buildPayload("42") }),
    ).resolves.toBe(user);
    expect(authService.isSessionActive).toHaveBeenCalledWith(42);
  });

  it("rejects tokens whose session was revoked", async () => {
    authService.isSessionActive.mockResolvedValue(false);
    const strategy = buildStrategy(true);

    await expect(
      strategy.validate({ payload: buildPayload("42") }),
    ).rejects.toThrow(UnauthorizedException);
    expect(usersService.findUserForAuthOrFail).not.toHaveBeenCalled();
  });

  it("keeps accepting tokens that were issued before binding existed", async () => {
    const strategy = buildStrategy(true);

    await expect(
      strategy.validate({ payload: buildPayload(undefined) }),
    ).resolves.toBe(user);
    expect(authService.isSessionActive).not.toHaveBeenCalled();
  });
});
