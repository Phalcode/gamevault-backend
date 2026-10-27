import { resolveCorsOriginAllowlist } from "./cors-origins.js";

describe("resolveCorsOriginAllowlist", () => {
  it("allows every origin when nothing is configured", () => {
    expect(resolveCorsOriginAllowlist([])).toBe(true);
  });

  it("allows every origin when a wildcard is configured", () => {
    expect(resolveCorsOriginAllowlist(["*"])).toBe(true);
  });

  it("always appends the desktop origins to configured origins", () => {
    expect(
      resolveCorsOriginAllowlist(["https://gamevault.example.com"]),
    ).toEqual([
      "https://gamevault.example.com",
      "http://tauri.localhost",
      "tauri://localhost",
    ]);
  });

  it("does not add the desktop origins twice", () => {
    expect(
      resolveCorsOriginAllowlist([
        "https://gamevault.example.com",
        "http://tauri.localhost",
      ]),
    ).toEqual([
      "https://gamevault.example.com",
      "http://tauri.localhost",
      "tauri://localhost",
    ]);
  });
});
