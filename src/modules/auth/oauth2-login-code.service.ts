import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { GamevaultUser } from "../users/gamevault-user.entity.js";

/** How long a login code can be redeemed. */
const CODE_LIFETIME_MS = 60_000;

/** A base64url encoded SHA-256 hash, the only challenge format of `S256`. */
const S256_CODE_CHALLENGE = /^[A-Za-z0-9_-]{43}$/;

interface PendingLogin {
  user: GamevaultUser;
  codeChallenge: string;
  expiresAt: number;
}

/**
 * Reads the PKCE challenge (RFC 7636) of a login request. Only the `S256`
 * method is supported.
 */
export function requireCodeChallenge(
  query: Record<string, unknown> = {},
): string {
  const { code_challenge, code_challenge_method } = query;
  if (
    code_challenge_method !== "S256" ||
    typeof code_challenge !== "string" ||
    !S256_CODE_CHALLENGE.test(code_challenge)
  ) {
    throw new BadRequestException(
      "Authentication Failed: A loopback client_origin requires a PKCE code_challenge with code_challenge_method=S256.",
    );
  }
  return code_challenge;
}

/**
 * Issues and redeems the one-time codes a native app receives on its loopback
 * listener instead of tokens (RFC 8252, section 6).
 *
 * A code is valid once, for a short time, and only together with the PKCE
 * verifier of the app that started the login. The state is in-memory and
 * therefore per process, like the session that carries the OAuth2 round trip.
 */
@Injectable()
export class OAuth2LoginCodeService {
  private readonly pending = new Map<string, PendingLogin>();

  /** Creates a code for a user who just authenticated. */
  issue(user: GamevaultUser, codeChallenge: string): string {
    const now = Date.now();
    // Drops expired codes so the map cannot grow without bound.
    for (const [code, login] of this.pending) {
      if (login.expiresAt <= now) this.pending.delete(code);
    }

    const code = randomBytes(32).toString("base64url");
    this.pending.set(code, {
      user,
      codeChallenge,
      expiresAt: now + CODE_LIFETIME_MS,
    });
    return code;
  }

  /** Returns the user a code was issued for. Every code works only once. */
  redeem(code: string, codeVerifier: string): GamevaultUser {
    const login = this.pending.get(code);
    this.pending.delete(code);

    if (
      !login ||
      login.expiresAt <= Date.now() ||
      !matchesChallenge(codeVerifier, login.codeChallenge)
    ) {
      throw new UnauthorizedException(
        "Authentication Failed: The login code is invalid, expired or was already used.",
      );
    }
    return login.user;
  }
}

function matchesChallenge(codeVerifier: string, codeChallenge: string) {
  const computed = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  return timingSafeEqual(Buffer.from(computed), Buffer.from(codeChallenge));
}
