import { randomBytes } from "node:crypto";

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
