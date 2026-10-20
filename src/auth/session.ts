import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "wishlist_session";

export function sessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET;
  return secret ? secret : null;
}

export function signSession(userId: string, secret: string): string {
  const mac = createHmac("sha256", secret).update(userId).digest("base64url");
  return `${userId}.${mac}`;
}

export function readSession(token: string, secret: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const userId = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(userId).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return userId;
}
