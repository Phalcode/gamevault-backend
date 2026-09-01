import "reflect-metadata";

import { AuthenticationGuard } from "../modules/auth/guards/authentication.guard.js";
import { AuthorizationGuard } from "../modules/auth/guards/authorization.guard.js";
import { Role } from "../modules/users/models/role.enum.js";
import {
  DISABLE_API_IF_KEY,
  DisableApiIf,
} from "./disable-api-if.decorator.js";
import { MINIMUM_ROLE_KEY, MinimumRole } from "./minimum-role.decorator.js";
import { SKIP_GUARDS_KEY, SkipGuards } from "./skip-guards.decorator.js";

class DecoratorFixture {
  @DisableApiIf(true)
  disabledRoute() {}

  @MinimumRole(Role.ADMIN)
  adminRoute() {}

  @SkipGuards()
  defaultSkippedGuardsRoute() {}

  @SkipGuards(["CustomGuard"])
  customSkippedGuardsRoute() {}
}

describe("DisableApiIf", () => {
  it("should export the metadata key", () => {
    expect(DISABLE_API_IF_KEY).toBe("disableApiIf");
  });

  it("should apply disabled state metadata", () => {
    const metadata = Reflect.getMetadata(
      DISABLE_API_IF_KEY,
      DecoratorFixture.prototype.disabledRoute,
    );

    expect(metadata).toBe(true);
  });
});

describe("MinimumRole", () => {
  it("should export the metadata key", () => {
    expect(MINIMUM_ROLE_KEY).toBe("minimumRole");
  });

  it("should apply minimum role metadata", () => {
    const metadata = Reflect.getMetadata(
      MINIMUM_ROLE_KEY,
      DecoratorFixture.prototype.adminRoute,
    );

    expect(metadata).toBe(Role.ADMIN);
  });
});

describe("SkipGuards", () => {
  it("should export the metadata key", () => {
    expect(SKIP_GUARDS_KEY).toBe("skip-guards");
  });

  it("should apply default skipped guards metadata", () => {
    const metadata = Reflect.getMetadata(
      SKIP_GUARDS_KEY,
      DecoratorFixture.prototype.defaultSkippedGuardsRoute,
    );

    expect(metadata).toEqual([
      AuthenticationGuard.name,
      AuthorizationGuard.name,
    ]);
  });

  it("should apply custom skipped guards metadata", () => {
    const metadata = Reflect.getMetadata(
      SKIP_GUARDS_KEY,
      DecoratorFixture.prototype.customSkippedGuardsRoute,
    );

    expect(metadata).toEqual(["CustomGuard"]);
  });
});
