import { describe, expect, it } from "vitest";
import { resolveDownloadSpeedLimit } from "./download-speed-limit.js";

const KB = 1024;

describe("resolveDownloadSpeedLimit", () => {
  it("returns 0 when no limit is configured", () => {
    expect(resolveDownloadSpeedLimit(undefined, undefined)).toBe(0);
  });

  it("applies the server limit when the client sends none", () => {
    expect(resolveDownloadSpeedLimit(undefined, 500 * KB)).toBe(500 * KB);
  });

  it("converts the client limit from KB/s to bytes/s", () => {
    expect(resolveDownloadSpeedLimit(250, undefined)).toBe(250 * KB);
  });

  it("keeps the server limit when the client sends 0", () => {
    expect(resolveDownloadSpeedLimit(0, 500 * KB)).toBe(500 * KB);
  });

  it("ignores NaN and negative client values", () => {
    expect(resolveDownloadSpeedLimit(Number.NaN, 500 * KB)).toBe(500 * KB);
    expect(resolveDownloadSpeedLimit(-10, 500 * KB)).toBe(500 * KB);
  });

  it("uses the lower value when the client asks for less than the server cap", () => {
    expect(resolveDownloadSpeedLimit(100, 500 * KB)).toBe(100 * KB);
  });

  it("caps a client limit that is higher than the server cap", () => {
    expect(resolveDownloadSpeedLimit(5000, 500 * KB)).toBe(500 * KB);
  });

  it("ignores a server value of 0", () => {
    expect(resolveDownloadSpeedLimit(100, 0)).toBe(100 * KB);
  });
});
