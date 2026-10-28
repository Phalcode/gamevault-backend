import { UnauthorizedException } from "@nestjs/common";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { AppConfiguration } from "../../configuration.js";
import { OidcTokenVerifierService } from "./oidc-token-verifier.service.js";

const ISSUER = "https://idp.example.com";
const CLIENT_ID = "client-id";
const KID = "test-key";

type KeyPair = Awaited<ReturnType<typeof generateKeyPair>>;

let server: Server;
let baseUrl: string;
let keys: KeyPair;

async function signIdToken(
  privateKey: KeyPair["privateKey"],
  options: {
    nonce?: string;
    audience?: string;
    issuer?: string;
  } = {},
): Promise<string> {
  const builder = new SignJWT({
    nonce: options.nonce,
    preferred_username: "alice",
    email: "alice@example.com",
  })
    .setProtectedHeader({ alg: "RS256", kid: KID })
    .setSubject("idp-user-id")
    .setIssuedAt()
    .setExpirationTime("5m")
    .setIssuer(options.issuer ?? ISSUER)
    .setAudience(options.audience ?? CLIENT_ID);
  return builder.sign(privateKey);
}

function buildConfig(
  options: {
    verify?: boolean;
    issuer?: string | undefined;
    jwks?: string | undefined;
    nonce?: boolean;
    clientId?: string;
  } = {},
): AppConfiguration {
  return {
    AUTH: {
      OAUTH2: {
        CLIENT_ID: options.clientId ?? CLIENT_ID,
        ISSUER_URL: options.issuer,
        JWKS_URL: options.jwks,
        VERIFY_ID_TOKEN: options.verify ?? true,
        REQUIRE_NONCE: options.nonce ?? true,
      },
    },
  } as unknown as AppConfiguration;
}

describe("OidcTokenVerifierService", () => {
  beforeAll(async () => {
    keys = await generateKeyPair("RS256");
    const jwk = await exportJWK(keys.publicKey);
    jwk.kid = KID;
    jwk.alg = "RS256";
    jwk.use = "sig";

    server = createServer((request, response) => {
      response.setHeader("content-type", "application/json");
      if (request.url === "/jwks") {
        response.end(JSON.stringify({ keys: [jwk] }));
        return;
      }
      if (request.url === "/.well-known/openid-configuration") {
        response.end(
          JSON.stringify({
            issuer: baseUrl,
            jwks_uri: `${baseUrl}/jwks`,
          }),
        );
        return;
      }
      response.statusCode = 404;
      response.end("{}");
    });

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it("stays disabled without an issuer or JWKS URL", () => {
    const verifier = new OidcTokenVerifierService(buildConfig());

    expect(verifier.enabled).toBe(false);
    expect(verifier.requireNonce).toBe(false);
  });

  it("stays disabled when verification is switched off", () => {
    const verifier = new OidcTokenVerifierService(
      buildConfig({ verify: false, jwks: `${baseUrl}/jwks` }),
    );

    expect(verifier.enabled).toBe(false);
  });

  it("verifies a valid id_token and returns its claims", async () => {
    const verifier = new OidcTokenVerifierService(
      buildConfig({ jwks: `${baseUrl}/jwks` }),
    );
    const token = await signIdToken(keys.privateKey, { nonce: "nonce-123" });

    const claims = await verifier.verify(token, "nonce-123");

    expect(claims.sub).toBe("idp-user-id");
    expect(claims.preferred_username).toBe("alice");
  });

  it("discovers the JWKS URL from the issuer", async () => {
    const verifier = new OidcTokenVerifierService(
      buildConfig({ issuer: baseUrl }),
    );
    const token = await signIdToken(keys.privateKey, {
      nonce: "nonce-123",
      issuer: baseUrl,
    });

    await expect(verifier.verify(token, "nonce-123")).resolves.toEqual(
      expect.objectContaining({ sub: "idp-user-id" }),
    );
  });

  it("rejects a wrong audience", async () => {
    const verifier = new OidcTokenVerifierService(
      buildConfig({ jwks: `${baseUrl}/jwks` }),
    );
    const token = await signIdToken(keys.privateKey, {
      nonce: "nonce-123",
      audience: "another-client",
    });

    await expect(verifier.verify(token, "nonce-123")).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("rejects a wrong issuer", async () => {
    const verifier = new OidcTokenVerifierService(
      buildConfig({ jwks: `${baseUrl}/jwks`, issuer: ISSUER }),
    );
    const token = await signIdToken(keys.privateKey, {
      nonce: "nonce-123",
      issuer: "https://evil.example.com",
    });

    await expect(verifier.verify(token, "nonce-123")).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("rejects a nonce mismatch", async () => {
    const verifier = new OidcTokenVerifierService(
      buildConfig({ jwks: `${baseUrl}/jwks` }),
    );
    const token = await signIdToken(keys.privateKey, { nonce: "other-nonce" });

    await expect(verifier.verify(token, "nonce-123")).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("rejects a token without nonce when a nonce is required", async () => {
    const verifier = new OidcTokenVerifierService(
      buildConfig({ jwks: `${baseUrl}/jwks` }),
    );
    const token = await signIdToken(keys.privateKey);

    await expect(verifier.verify(token, "nonce-123")).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("accepts a token without nonce when nonces are not required", async () => {
    const verifier = new OidcTokenVerifierService(
      buildConfig({ jwks: `${baseUrl}/jwks`, nonce: false }),
    );
    const token = await signIdToken(keys.privateKey);

    await expect(verifier.verify(token)).resolves.toEqual(
      expect.objectContaining({ sub: "idp-user-id" }),
    );
  });

  it("rejects a token signed by another key", async () => {
    const verifier = new OidcTokenVerifierService(
      buildConfig({ jwks: `${baseUrl}/jwks` }),
    );
    const foreignKeys = await generateKeyPair("RS256");
    const token = await signIdToken(foreignKeys.privateKey, {
      nonce: "nonce-123",
    });

    await expect(verifier.verify(token, "nonce-123")).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
