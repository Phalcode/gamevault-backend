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

  it("should replace /api/v1/ with /api/", () => {
    const req = { url: "/api/v1/games" } as any;
    middleware.use(req, mockRes, mockNext);
    expect(req.url).toBe("/api/games");
    expect(mockNext).toHaveBeenCalled();
  });

  it("should redirect /api/files/reindex to /api/games/reindex", () => {
    const req = { url: "/api/files/reindex" } as any;
    middleware.use(req, mockRes, mockNext);
    expect(req.url).toBe("/api/games/reindex");
    expect(mockNext).toHaveBeenCalled();
  });

  it("should handle both v1 and files/reindex in the same URL", () => {
    const req = { url: "/api/v1/files/reindex" } as any;
    middleware.use(req, mockRes, mockNext);
    expect(req.url).toBe("/api/games/reindex");
    expect(mockNext).toHaveBeenCalled();
  });

  it("should not modify URLs that do not match legacy patterns", () => {
    const req = { url: "/api/games/123" } as any;
    middleware.use(req, mockRes, mockNext);
    expect(req.url).toBe("/api/games/123");
    expect(mockNext).toHaveBeenCalled();
  });

  it("should always call next()", () => {
    const req = { url: "/any/path" } as any;
    middleware.use(req, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });
});
