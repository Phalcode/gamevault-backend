import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import type { GamevaultUser } from "../users/gamevault-user.entity.js";
import {
  OAuth2LoginCodeService,
  requireCodeChallenge,
} from "./oauth2-login-code.service.js";

// The verifier and challenge of RFC 7636, appendix B.
const codeVerifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
const codeChallenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";

const user = { id: 1, username: "player" } as GamevaultUser;

describe("requireCodeChallenge", () => {
  it("returns an S256 code challenge", () => {
    expect(
      requireCodeChallenge({
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
      }),
    ).toBe(codeChallenge);
  });

  it("rejects a missing code challenge", () => {
    expect(() => requireCodeChallenge({})).toThrow(BadRequestException);
    expect(() => requireCodeChallenge()).toThrow(BadRequestException);
  });

  it("rejects every method but S256", () => {
    for (const code_challenge_method of [undefined, "plain", "s256"]) {
      expect(() =>
        requireCodeChallenge({
          code_challenge: codeChallenge,
          code_challenge_method,
        }),
      ).toThrow(BadRequestException);
    }
  });

  it("rejects a value that is not a SHA-256 hash in base64url", () => {
    for (const code_challenge of [
      "too-short",
      `${codeChallenge}A`,
      codeChallenge.replace("-", "+"),
      [codeChallenge],
    ]) {
      expect(() =>
        requireCodeChallenge({ code_challenge, code_challenge_method: "S256" }),
      ).toThrow(BadRequestException);
    }
  });
});

describe("OAuth2LoginCodeService", () => {
  let service: OAuth2LoginCodeService;

  beforeEach(() => {
    service = new OAuth2LoginCodeService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the user for a code and its verifier", () => {
    const code = service.issue(user, codeChallenge);

    expect(service.redeem(code, codeVerifier)).toBe(user);
  });

  it("issues a different code every time", () => {
    expect(service.issue(user, codeChallenge)).not.toBe(
      service.issue(user, codeChallenge),
    );
  });

  it("accepts a code only once", () => {
    const code = service.issue(user, codeChallenge);
    service.redeem(code, codeVerifier);

    expect(() => service.redeem(code, codeVerifier)).toThrow(
      UnauthorizedException,
    );
  });

  it("rejects a wrong verifier and uses the code up", () => {
    const code = service.issue(user, codeChallenge);

    expect(() => service.redeem(code, `${codeVerifier}x`)).toThrow(
      UnauthorizedException,
    );
    expect(() => service.redeem(code, codeVerifier)).toThrow(
      UnauthorizedException,
    );
  });

  it("rejects an unknown code", () => {
    expect(() => service.redeem("unknown", codeVerifier)).toThrow(
      UnauthorizedException,
    );
  });

  it("rejects a code after one minute", () => {
    vi.useFakeTimers();
    const code = service.issue(user, codeChallenge);

    vi.advanceTimersByTime(60_000);

    expect(() => service.redeem(code, codeVerifier)).toThrow(
      UnauthorizedException,
    );
  });

  it("still accepts a code shortly before it expires", () => {
    vi.useFakeTimers();
    const code = service.issue(user, codeChallenge);

    vi.advanceTimersByTime(59_000);

    expect(service.redeem(code, codeVerifier)).toBe(user);
  });
});
