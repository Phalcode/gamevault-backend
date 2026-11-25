import { BadRequestException, type ExecutionContext } from "@nestjs/common";
import type { AppConfiguration } from "../../../configuration.js";
import { Oauth2Guard } from "./oauth2.guard.js";

// The challenge of RFC 7636, appendix B.
const codeChallenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";

const config = {
  AUTH: {
    OAUTH2: {
      CALLBACK_URL: "https://gamevault.example.com/api/auth/oauth2/login",
      LOOPBACK_RETURN_ENABLED: true,
    },
  },
  SERVER: { CORS_ALLOWED_ORIGINS: [] },
} as unknown as AppConfiguration;

interface Session {
  oauth2ReturnOrigin?: string;
  oauth2CodeChallenge?: string;
}

function authenticate(
  query: Record<string, unknown>,
  session: Session = {},
  guardConfig = config,
) {
  const guard = new Oauth2Guard({} as never, guardConfig, {
    requireNonce: false,
  } as never);
  const context = {
    switchToHttp: () => ({ getRequest: () => ({ query, session }) }),
  } as unknown as ExecutionContext;

  guard.getAuthenticateOptions(context);
  return session;
}

describe("Oauth2Guard", () => {
  it("stores a loopback return origin together with its code challenge", () => {
    expect(
      authenticate({
        client_origin: "http://127.0.0.1:49152",
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
      }),
    ).toEqual({
      oauth2ReturnOrigin: "http://127.0.0.1:49152",
      oauth2CodeChallenge: codeChallenge,
    });
  });

  it("rejects a loopback return origin without a code challenge", () => {
    const session: Session = {};

    expect(() =>
      authenticate({ client_origin: "http://127.0.0.1:49152" }, session),
    ).toThrow(BadRequestException);
    expect(session).toEqual({});
  });

  it("rejects a loopback return origin with the plain method", () => {
    expect(() =>
      authenticate({
        client_origin: "http://[::1]:49152",
        code_challenge: codeChallenge,
        code_challenge_method: "plain",
      }),
    ).toThrow(BadRequestException);
  });

  it("keeps a CORS-listed loopback origin on the token handoff", () => {
    const corsConfig = {
      ...config,
      SERVER: { CORS_ALLOWED_ORIGINS: ["http://127.0.0.1:5173"] },
    } as unknown as AppConfiguration;

    expect(
      authenticate({ client_origin: "http://127.0.0.1:5173" }, {}, corsConfig),
    ).toEqual({ oauth2ReturnOrigin: "http://127.0.0.1:5173" });
  });

  it("keeps a CORS-listed loopback origin on the token handoff when the switch is off", () => {
    const corsConfig = {
      ...config,
      AUTH: {
        OAUTH2: { ...config.AUTH.OAUTH2, LOOPBACK_RETURN_ENABLED: false },
      },
      SERVER: { CORS_ALLOWED_ORIGINS: ["http://127.0.0.1:5173"] },
    } as unknown as AppConfiguration;

    expect(
      authenticate({ client_origin: "http://127.0.0.1:5173" }, {}, corsConfig),
    ).toEqual({ oauth2ReturnOrigin: "http://127.0.0.1:5173" });
  });

  it("ignores a code challenge for every other return origin", () => {
    expect(
      authenticate({
        client_origin: "http://tauri.localhost",
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
      }),
    ).toEqual({ oauth2ReturnOrigin: "http://tauri.localhost" });
  });

  it("drops the values of a previous attempt", () => {
    expect(
      authenticate(
        {},
        {
          oauth2ReturnOrigin: "http://127.0.0.1:49152",
          oauth2CodeChallenge: codeChallenge,
        },
      ),
    ).toEqual({});
  });

  it("leaves the session alone on the callback request", () => {
    const session = {
      oauth2ReturnOrigin: "http://127.0.0.1:49152",
      oauth2CodeChallenge: codeChallenge,
    };

    expect(
      authenticate({ code: "idp-code", state: "idp-state" }, session),
    ).toEqual({
      oauth2ReturnOrigin: "http://127.0.0.1:49152",
      oauth2CodeChallenge: codeChallenge,
    });
  });
});
