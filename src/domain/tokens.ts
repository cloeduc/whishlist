import { createHash, randomBytes } from "node:crypto";

export function newId(): string {
  return randomBytes(12).toString("base64url");
}

export function newToken(): string {
  return randomBytes(18).toString("base64url");
}

export function distinctTokens(): { readToken: string; inviteToken: string } {
  const readToken = newToken();
  let inviteToken = newToken();
  while (inviteToken === readToken) inviteToken = newToken();
  return { readToken, inviteToken };
}

/** 256-bit secret token (password reset, API session). */
export function newSecretToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Stored hash of a secret token: SHA-256 is enough for 256 bits of entropy. */
export function hashSecretToken(token: string): string {
  return createHash("sha256").update(token).digest("base64url");
}
