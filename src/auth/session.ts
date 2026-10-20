import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "wishlist_session";

/** Durée de vie réelle du token signé (alignée sur maxAge cookie). */
export const SESSION_TTL_SEC = 60 * 60 * 24 * 30;

export function sessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET;
  return secret ? secret : null;
}

function macBody(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

function safeEqualB64(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** Cookie = `userId.iat.exp.mac` (HMAC-SHA256 sur `userId.iat.exp`). */
export function signSession(userId: string, secret: string, nowMs = Date.now()): string {
  if (!userId || userId.includes(".")) throw new Error("invalid session subject");
  const iat = Math.floor(nowMs / 1000);
  const exp = iat + SESSION_TTL_SEC;
  const body = `${userId}.${iat}.${exp}`;
  return `${body}.${macBody(body, secret)}`;
}

export function readSession(token: string, secret: string, nowMs = Date.now()): string | null {
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [userId, iatStr, expStr, mac] = parts;
  if (!userId || !iatStr || !expStr || !mac) return null;
  if (!/^\d+$/.test(iatStr) || !/^\d+$/.test(expStr)) return null;

  const body = `${userId}.${iatStr}.${expStr}`;
  const expected = macBody(body, secret);
  if (!safeEqualB64(mac, expected)) return null;

  const iat = Number(iatStr);
  const exp = Number(expStr);
  const now = Math.floor(nowMs / 1000);
  if (!Number.isFinite(iat) || !Number.isFinite(exp)) return null;
  if (exp !== iat + SESSION_TTL_SEC) return null; // TTL figé, anti-extension
  if (iat > now + 60) return null; // horloge future
  if (exp <= now) return null;
  return userId;
}
