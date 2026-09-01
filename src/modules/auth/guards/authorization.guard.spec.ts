import { ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import configuration from "../../../configuration.js";

import type { Mocked } from "vitest";
import { Role } from "../../users/models/role.enum.js";
import { AuthorizationGuard } from "./authorization.guard.js";

// Mock configuration
vi.mock("../../../configuration.js", () => ({
  __esModule: true,
  default: {
    TESTING: { AUTHENTICATION_DISABLED: false },
  },
}));

vi.mock("../../../logging.js", () => ({
  __esModule: true,
  default: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
  logGamevaultGame: vi.fn(),
  logGamevaultUser: vi.fn(),
  logMedia: vi.fn(),
  logMetadata: vi.fn(),
  logMetadataProvider: vi.fn(),
  logProgress: vi.fn(),
}));

describe("AuthorizationGuard", () => {
  let guard: AuthorizationGuard;
  let reflector: Mocked<Reflector>;
  let mockUsersService: any;

  function createMockContext(user?: any, overrides?: any) {
    return {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user, ...overrides }),
      }),
    } as any;
  }

  beforeEach(() => {
    reflector = {
      getAllAndOverride: vi.fn(),
      get: vi.fn(),
    } as any;

    mockUsersService = {
      find: vi.fn(),
    };

    guard = new AuthorizationGuard(
      reflector,
      mockUsersService,
      configuration as any,
    );
  });

  it("should allow access when skip-guards includes AuthorizationGuard", async () => {
    reflector.getAllAndOverride.mockReturnValue(["AuthorizationGuard"]);

    const result = await guard.canActivate(createMockContext());
    expect(result).toBe(true);
  });

  it("should allow access when no minimum role is required", async () => {
    reflector.getAllAndOverride.mockReturnValue(null);
    reflector.get.mockReturnValue(undefined);

    const result = await guard.canActivate(
      createMockContext({ role: Role.USER }),
    );
    expect(result).toBe(true);
  });

  it("should allow access when user role meets minimum", async () => {
    reflector.getAllAndOverride.mockReturnValue(null);
    reflector.get.mockReturnValue(Role.USER);

    const result = await guard.canActivate(
      createMockContext({ role: Role.ADMIN }),
    );
    expect(result).toBe(true);
  });

  it("should throw ForbiddenException when user role is too low", async () => {
    reflector.getAllAndOverride.mockReturnValue(null);
    reflector.get.mockReturnValue(Role.ADMIN);

    await expect(
      guard.canActivate(createMockContext({ role: Role.USER })),
    ).rejects.toThrow(ForbiddenException);
  });

  it("should allow equal role", async () => {
    reflector.getAllAndOverride.mockReturnValue(null);
    reflector.get.mockReturnValue(Role.EDITOR);

    const result = await guard.canActivate(
      createMockContext({ role: Role.EDITOR }),
    );
    expect(result).toBe(true);
  });

  it("should throw GUEST trying to access USER-only endpoint", async () => {
    reflector.getAllAndOverride.mockReturnValue(null);
    reflector.get.mockReturnValue(Role.USER);

    await expect(
      guard.canActivate(createMockContext({ role: Role.GUEST })),
    ).rejects.toThrow(ForbiddenException);
  });
});

describe("AuthorizationGuard (auth disabled)", () => {
  let guard: AuthorizationGuard;
  let reflector: Mocked<Reflector>;
  let mockUsersService: any;

  beforeEach(() => {
    // Dynamically set AUTHENTICATION_DISABLED
    const config = configuration as any;
    config.TESTING.AUTHENTICATION_DISABLED = true;

    reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(null),
      get: vi.fn().mockReturnValue(Role.ADMIN),
    } as any;

    mockUsersService = {
      find: vi
        .fn()
        .mockResolvedValue([{ username: "admin", role: Role.ADMIN }]),
    };

    guard = new AuthorizationGuard(reflector, mockUsersService, config as any);
  });

  afterEach(() => {
    const config = configuration as any;
    config.TESTING.AUTHENTICATION_DISABLED = false;
  });

  it("should bypass authorization and use first user", async () => {
    const req = {} as any;
    const ctx = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    } as any;

    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
    expect(req.user).toEqual({ username: "admin", role: Role.ADMIN });
  });
});
