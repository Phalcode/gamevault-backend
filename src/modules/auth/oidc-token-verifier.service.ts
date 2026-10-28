import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTPayload,
  type JWTVerifyGetKey,
} from "jose";
import type { AppConfiguration } from "../../configuration.js";
import { InjectGamevaultConfig } from "../../decorators/inject-gamevault-config.decorator.js";

interface OpenIdConfiguration {
  jwks_uri?: string;
}

/**
 * Verifies OIDC `id_token`s against the identity provider's JWKS.
 *
 * Disabled by default: verification only runs when
 * `AUTH_OAUTH2_VERIFY_ID_TOKEN` is enabled **and** an issuer or JWKS URL is
 * configured. Without that configuration the strategy keeps decoding tokens
 * only, which is the historical behaviour.
 */
@Injectable()
export class OidcTokenVerifierService {
  private readonly logger = new Logger(this.constructor.name);
  private keySet?: JWTVerifyGetKey;
  private jwksUri?: string;

  constructor(
    @InjectGamevaultConfig() private readonly config: AppConfiguration,
  ) {
    if (this.enabled) {
      this.logger.log({
        message: "OIDC id_token verification is enabled.",
        issuer: this.config.AUTH.OAUTH2.ISSUER_URL,
        jwks_url: this.config.AUTH.OAUTH2.JWKS_URL,
        require_nonce: this.config.AUTH.OAUTH2.REQUIRE_NONCE,
      });
    } else if (this.config.AUTH.OAUTH2.VERIFY_ID_TOKEN) {
      this.logger.warn({
        message:
          "AUTH_OAUTH2_VERIFY_ID_TOKEN is enabled, but neither AUTH_OAUTH2_ISSUER_URL nor AUTH_OAUTH2_JWKS_URL is set. id_tokens will only be decoded.",
      });
    }
  }

  /** Whether id_tokens can and should be verified. */
  get enabled(): boolean {
    const { VERIFY_ID_TOKEN, ISSUER_URL, JWKS_URL } = this.config.AUTH.OAUTH2;
    return VERIFY_ID_TOKEN && !!(ISSUER_URL || JWKS_URL);
  }

  /** Whether a nonce is required and therefore has to be sent to the IdP. */
  get requireNonce(): boolean {
    return this.enabled && this.config.AUTH.OAUTH2.REQUIRE_NONCE;
  }

  /**
   * Verifies signature, issuer, audience and expiry of an `id_token`, plus the
   * nonce when required.
   */
  async verify(idToken: string, expectedNonce?: string): Promise<JWTPayload> {
    const { ISSUER_URL, CLIENT_ID } = this.config.AUTH.OAUTH2;
    try {
      const { payload } = await jwtVerify(idToken, await this.getKeySet(), {
        issuer: ISSUER_URL || undefined,
        audience: CLIENT_ID || undefined,
      });

      if (this.requireNonce) {
        if (!expectedNonce) {
          throw new UnauthorizedException(
            "Authentication Failed: No nonce was stored for this login attempt.",
          );
        }
        if (payload.nonce !== expectedNonce) {
          throw new UnauthorizedException(
            "Authentication Failed: The id_token nonce does not match this login attempt.",
          );
        }
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.warn({
        message: "Failed to verify the id_token of the identity provider.",
        error,
      });
      throw new UnauthorizedException(
        "Authentication Failed: The id_token of the identity provider could not be verified.",
      );
    }
  }

  private async getKeySet(): Promise<JWTVerifyGetKey> {
    if (!this.keySet) {
      this.keySet = createRemoteJWKSet(new URL(await this.resolveJwksUri()));
    }
    return this.keySet;
  }

  /** Uses the explicit JWKS URL, falling back to OIDC discovery. */
  private async resolveJwksUri(): Promise<string> {
    if (this.jwksUri) return this.jwksUri;

    const { JWKS_URL, ISSUER_URL } = this.config.AUTH.OAUTH2;
    if (JWKS_URL) {
      this.jwksUri = JWKS_URL;
      return this.jwksUri;
    }
    if (!ISSUER_URL) {
      throw new UnauthorizedException(
        "Authentication Failed: No JWKS URL is configured for id_token verification.",
      );
    }

    const discoveryUrl = `${ISSUER_URL.replace(/\/+$/, "")}/.well-known/openid-configuration`;
    const response = await fetch(discoveryUrl);
    if (!response.ok) {
      throw new UnauthorizedException(
        `Authentication Failed: Could not discover the JWKS URL of the identity provider (${response.status}).`,
      );
    }
    const openidConfiguration = (await response.json()) as OpenIdConfiguration;
    if (!openidConfiguration.jwks_uri) {
      throw new UnauthorizedException(
        "Authentication Failed: The identity provider did not advertise a JWKS URL.",
      );
    }

    this.jwksUri = openidConfiguration.jwks_uri;
    return this.jwksUri;
  }
}
