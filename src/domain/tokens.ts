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

/** Jeton secret de 256 bits (reset de mot de passe, session d'API). */
export function newSecretToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Empreinte stockée d'un jeton secret : SHA-256 suffit pour 256 bits d'entropie. */
export function hashSecretToken(token: string): string {
  return createHash("sha256").update(token).digest("base64url");
}
