import { BadRequestException, Logger } from "@nestjs/common";
import type { Response } from "express";
import { OAuth2LoginCodeService } from "../oauth2-login-code.service.js";
import { OAuth2Controller } from "./oauth2.controller.js";

vi.mock("../../../configuration.js", () => ({
  __esModule: true,
  default: {
    AUTH: {
      OAUTH2: {
        SCOPES: [],
        CALLBACK_URL: "https://gamevault.example.com/api/auth/oauth2/login",
        LOOPBACK_RETURN_ENABLED: true,
      },
    },
    SERVER: { CORS_ALLOWED_ORIGINS: [] },
  },
}));

interface MockResponse {
  set: ReturnType<typeof vi.fn>;
  status: ReturnType<typeof vi.fn>;
  contentType: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
  redirect: ReturnType<typeof vi.fn>;
}

function createResponse(): MockResponse {
  const response = {
    set: vi.fn(),
    status: vi.fn(),
    contentType: vi.fn(),
    send: vi.fn(),
    redirect: vi.fn(),
  };
  response.set.mockReturnValue(response);
  response.status.mockReturnValue(response);
  response.contentType.mockReturnValue(response);
  response.send.mockReturnValue(response);
  return response;
}

function createRequest(returnOrigin?: string, codeChallenge?: string) {
  const session: { oauth2ReturnOrigin?: string; oauth2CodeChallenge?: string } =
    {};
  if (returnOrigin) session.oauth2ReturnOrigin = returnOrigin;
  if (codeChallenge) session.oauth2CodeChallenge = codeChallenge;
  return {
    user: { id: 1, username: "player" },
    ip: "203.0.113.7",
    headers: { "user-agent": "GameVault/1.17.5" },
    session,
  };
}

async function renderHandoff(
  options: {
    returnOrigin?: string;
    accessToken?: string;
    refreshToken?: string | null;
  } = {},
): Promise<{
  html: string;
  res: MockResponse;
  login: ReturnType<typeof vi.fn>;
}> {
  const login = vi.fn().mockResolvedValue({
    access_token: options.accessToken ?? "access-token-value",
    refresh_token:
      options.refreshToken === undefined
        ? "refresh-token-value"
        : options.refreshToken,
  });
  const controller = new OAuth2Controller(
    { login } as never,
    new OAuth2LoginCodeService(),
  );
  const res = createResponse();

  await controller.getAuthOauth2Login(
    createRequest(options.returnOrigin) as never,
    res as unknown as Response,
  );

  return { html: res.send.mock.calls[0]![0] as string, res, login };
}

/**
 * Reads the page text the same way the legacy desktop client does:
 * `document.body.innerText` of the rendered document. Only the handoff text node
 * may carry text, otherwise that client cannot parse the response.
 */
function readHandoffText(html: string): string {
  const body = /<body>([\s\S]*)<\/body>/.exec(html)?.[1] ?? "";
  const textNode = /<p id="gamevault-handoff"[^>]*>([\s\S]*?)<\/p>/.exec(body);
  if (!textNode) throw new Error("handoff text node missing");
  const surroundingText = body
    .replace(textNode[0], "")
    .replace(/<script>[\s\S]*?<\/script>/g, "")
    .trim();
  if (surroundingText) {
    throw new Error(`unexpected page text: ${surroundingText}`);
  }
  return textNode[1]!;
}

describe("OAuth2Controller handoff page", () => {
  beforeEach(() => {
    vi.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the token response as page text for the legacy desktop client", async () => {
    const { html } = await renderHandoff();

    expect(JSON.parse(readHandoffText(html))).toEqual({
      type: "gamevault:sso",
      access_token: "access-token-value",
      refresh_token: "refresh-token-value",
    });
  });

  it("escapes characters that would end the text node early", async () => {
    const { html } = await renderHandoff({ accessToken: "a&b<c" });

    expect(readHandoffText(html)).toContain("a&amp;b&lt;c");
  });

  it("keeps the redirect delayed so the page text is readable first", async () => {
    const { html } = await renderHandoff();

    expect(html).toContain("setTimeout(function () {");
    expect(html).toContain("}, 300);");
  });

  it("hands the tokens to the opener window in the web popup flow", async () => {
    const { html } = await renderHandoff({
      returnOrigin: "https://gamevault.example.com",
    });

    expect(html).toContain("window.opener.postMessage(handoff, returnOrigin)");
    expect(html).toContain(
      'var returnOrigin = "https://gamevault.example.com";',
    );
  });

  it("redirects the desktop client to its own origin", async () => {
    const { html } = await renderHandoff({
      returnOrigin: "http://tauri.localhost",
    });

    expect(html).toContain('var returnOrigin = "http://tauri.localhost";');
    expect(html).toContain('window.location.replace(target + "/" + query)');
  });

  it("ignores a return origin that was not validated", async () => {
    const { html } = await renderHandoff({
      returnOrigin: "https://evil.example",
    });

    expect(html).toContain("var returnOrigin = null;");
  });

  it("omits the refresh token when the server did not issue one", async () => {
    const { html } = await renderHandoff({ refreshToken: null });

    expect(JSON.parse(readHandoffText(html)).refresh_token).toBeNull();
  });

  it("never caches a response that carries tokens", async () => {
    const { res } = await renderHandoff();

    expect(res.set).toHaveBeenCalledWith("Cache-Control", "no-store");
    expect(res.set).toHaveBeenCalledWith("Referrer-Policy", "no-referrer");
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("OAuth2Controller loopback login", () => {
  // The verifier and challenge of RFC 7636, appendix B.
  const codeVerifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
  const codeChallenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";

  function createController() {
    const login = vi.fn().mockResolvedValue({
      access_token: "access-token-value",
      refresh_token: "refresh-token-value",
    });
    const controller = new OAuth2Controller(
      { login } as never,
      new OAuth2LoginCodeService(),
    );
    return { controller, login };
  }

  beforeEach(() => {
    vi.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("redirects to the loopback listener with a code instead of tokens", async () => {
    const { controller, login } = createController();
    const res = createResponse();
    const request = createRequest("http://127.0.0.1:49152", codeChallenge);

    await controller.getAuthOauth2Login(
      request as never,
      res as unknown as Response,
    );

    expect(res.redirect).toHaveBeenCalledWith(
      expect.stringMatching(/^http:\/\/127\.0\.0\.1:49152\/\?code=[\w-]{43}$/),
    );
    expect(res.send).not.toHaveBeenCalled();
    expect(login).not.toHaveBeenCalled();
    expect(res.set).toHaveBeenCalledWith("Cache-Control", "no-store");
    expect(request.session).toEqual({});
  });

  it("exchanges the code and its verifier for tokens", async () => {
    const { controller, login } = createController();
    const res = createResponse();
    await controller.getAuthOauth2Login(
      createRequest("http://[::1]:49152", codeChallenge) as never,
      res as unknown as Response,
    );
    const code = new URL(
      res.redirect.mock.calls[0]![0] as string,
    ).searchParams.get("code")!;

    const tokens = await controller.postAuthOauth2Token(
      { code, code_verifier: codeVerifier },
      { ip: "198.51.100.4", headers: { "user-agent": "NativeApp/1.0" } },
    );

    expect(tokens).toEqual({
      access_token: "access-token-value",
      refresh_token: "refresh-token-value",
    });
    expect(login).toHaveBeenCalledWith(
      expect.objectContaining({ username: "player" }),
      "198.51.100.4",
      "NativeApp/1.0",
    );
  });

  it("refuses a loopback return without a stored code challenge", async () => {
    const { controller, login } = createController();
    const res = createResponse();

    await expect(
      controller.getAuthOauth2Login(
        createRequest("http://127.0.0.1:49152") as never,
        res as unknown as Response,
      ),
    ).rejects.toThrow(BadRequestException);
    expect(res.redirect).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
    expect(login).not.toHaveBeenCalled();
  });
});
