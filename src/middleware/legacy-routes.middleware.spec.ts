import type { Mock } from "vitest";
import { LegacyRoutesMiddleware } from "./legacy-routes.middleware.js";

describe("LegacyRoutesMiddleware", () => {
  let middleware: LegacyRoutesMiddleware;
  let mockNext: Mock;
  let mockRes: any;

  beforeEach(() => {
    middleware = new LegacyRoutesMiddleware();
    mockNext = vi.fn();
    mockRes = {};
  });

  it.each([
    { input: "/api/v1/games", expected: "/api/games" },
    { input: "/api/files/reindex", expected: "/api/games/reindex" },
    { input: "/api/v1/files/reindex", expected: "/api/games/reindex" },
    { input: "/api/games/123", expected: "/api/games/123" },
  ])("should rewrite $input to $expected", ({ input, expected }) => {
    const req = { url: input } as any;
    middleware.use(req, mockRes, mockNext);
    expect(req.url).toBe(expected);
    expect(mockNext).toHaveBeenCalled();
  });

  it("should always call next()", () => {
    const req = { url: "/any/path" } as any;
    middleware.use(req, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });
});
