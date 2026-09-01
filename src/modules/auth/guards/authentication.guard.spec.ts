import { Reflector } from "@nestjs/core";
import configuration from "../../../configuration.js";

import type { Mocked } from "vitest";
import { AuthenticationGuard } from "./authentication.guard.js";

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

// Mock AuthGuard so we don't need Passport infrastructure
vi.mock("@nestjs/passport", () => ({
  AuthGuard: () => {
    class MockAuthGuard {
      canActivate = vi.fn().mockReturnValue(true);
    }
    return MockAuthGuard;
  },
}));

describe("AuthenticationGuard", () => {
  let guard: AuthenticationGuard;
  let reflector: Mocked<Reflector>;

  function createContext(user?: any) {
    return {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as any;
  }

  beforeEach(() => {
    reflector = {
      getAllAndOverride: vi.fn(),
    } as any;

    guard = new AuthenticationGuard(reflector, configuration as any);
  });

  it("should skip when guard name is in skip-guards metadata", () => {
    reflector.getAllAndOverride.mockReturnValue(["AuthenticationGuard"]);

    const result = guard.canActivate(createContext());
    expect(result).toBe(true);
  });

  it("should skip when user is already set on request", () => {
    reflector.getAllAndOverride.mockReturnValue(null);

    const result = guard.canActivate(
      createContext({ id: 1, username: "test" }),
    );
    expect(result).toBe(true);
  });

  it("should delegate to super.canActivate when no user and not skipped", () => {
    reflector.getAllAndOverride.mockReturnValue(null);

    const result = guard.canActivate(createContext(undefined));
    // super.canActivate is mocked to return true
    expect(result).toBe(true);
  });
});

describe("AuthenticationGuard (auth disabled)", () => {
  let guard: AuthenticationGuard;
  let reflector: Mocked<Reflector>;

  beforeEach(() => {
    const config = configuration as any;
    config.TESTING.AUTHENTICATION_DISABLED = true;

    reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(null),
    } as any;

    guard = new AuthenticationGuard(reflector, config as any);
  });

  afterEach(() => {
    const config = configuration as any;
    config.TESTING.AUTHENTICATION_DISABLED = false;
  });

  it("should skip authentication when disabled", () => {
    const result = guard.canActivate({
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as any);
    expect(result).toBe(true);
  });
});
