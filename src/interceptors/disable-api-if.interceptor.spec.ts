import { MethodNotAllowedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { of } from "rxjs";
import type { Mocked } from "vitest";
import { DisableApiIfInterceptor } from "./disable-api-if.interceptor.js";

describe("DisableApiIfInterceptor", () => {
  let interceptor: DisableApiIfInterceptor;
  let reflector: Mocked<Reflector>;
  let mockExecutionContext: any;
  let mockCallHandler: any;

  beforeEach(() => {
    reflector = { get: vi.fn() } as any;
    interceptor = new DisableApiIfInterceptor(reflector);
    mockExecutionContext = {
      getHandler: vi.fn(),
    };
    mockCallHandler = {
      handle: vi.fn().mockReturnValue(of("result")),
    };
  });

  it("should throw MethodNotAllowedException when API is disabled", () => {
    reflector.get.mockReturnValue(true);
    expect(() =>
      interceptor.intercept(mockExecutionContext, mockCallHandler),
    ).toThrow(MethodNotAllowedException);
  });

  it("should call next.handle() when API is not disabled", async () => {
    reflector.get.mockReturnValue(false);
    const result$ = interceptor.intercept(
      mockExecutionContext,
      mockCallHandler,
    );
    await new Promise<void>((resolve) => {
      result$.subscribe({
        next: (value) => {
          expect(value).toBe("result");
          expect(mockCallHandler.handle).toHaveBeenCalled();
          resolve();
        },
      });
    });
  });

  it("should call next.handle() when no metadata is set", async () => {
    reflector.get.mockReturnValue(undefined);
    const result$ = interceptor.intercept(
      mockExecutionContext,
      mockCallHandler,
    );
    await new Promise<void>((resolve) => {
      result$.subscribe({
        next: () => {
          expect(mockCallHandler.handle).toHaveBeenCalled();
          resolve();
        },
      });
    });
  });

  it("should include correct error message when disabled", () => {
    reflector.get.mockReturnValue(true);
    try {
      interceptor.intercept(mockExecutionContext, mockCallHandler);
      throw new Error("Expected MethodNotAllowedException");
    } catch (e) {
      expect(e).toBeInstanceOf(MethodNotAllowedException);
      expect((e as MethodNotAllowedException).message).toBe(
        "This API endpoint is disabled.",
      );
    }
  });
});
