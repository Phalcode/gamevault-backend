import { describe, expect, it } from "vitest";
import {
  collectorUserAgent,
  platformTokenFor,
} from "./collector-user-agent.js";

describe("collectorUserAgent", () => {
  it("reports the server in the desktop client's user agent shape", () => {
    expect(collectorUserAgent("17.1.0")).toMatch(
      /^GameVault\/1\.17\.1\.0 \(.+\)$/,
    );
  });

  it("keeps the parenthesised platform token", () => {
    // Without the parentheses Swetrix's bot protection drops the request.
    expect(collectorUserAgent("17.1.0").endsWith(")")).toBe(true);
  });
});

describe("platformTokenFor", () => {
  it("uses the browser tokens analytics parsers expect", () => {
    expect(platformTokenFor("win32", "x64")).toBe(
      "Windows NT 10.0; Win64; x64",
    );
    expect(platformTokenFor("win32", "arm64")).toBe("Windows NT 10.0; ARM64");
    expect(platformTokenFor("win32", "ia32")).toBe("Windows NT 10.0; Win32");
    expect(platformTokenFor("darwin", "arm64")).toBe(
      "Macintosh; Intel Mac OS X 10_15_7",
    );
    expect(platformTokenFor("linux", "x64")).toBe("X11; Linux x86_64");
    expect(platformTokenFor("linux", "arm64")).toBe("X11; Linux aarch64");
    expect(platformTokenFor("linux", "arm")).toBe("X11; Linux armv7l");
    expect(platformTokenFor("linux", "ia32")).toBe("X11; Linux i686");
  });

  it("falls back to the bare os name and architecture", () => {
    expect(platformTokenFor("freebsd", "x64")).toBe("freebsd");
    expect(platformTokenFor("linux", "riscv64")).toBe("X11; Linux riscv64");
  });
});
