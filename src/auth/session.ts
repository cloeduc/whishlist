import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "wishlist_session";

/** Durée de vie réelle du token signé (alignée sur maxAge cookie). */
export const SESSION_TTL_SEC = 60 * 60 * 24 * 30;

const MIN_SESSION_SECRET_LENGTH = 32;

export function sessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  if (process.env.NODE_ENV === "production" && secret.length < MIN_SESSION_SECRET_LENGTH) {
    throw new Error("SESSION_SECRET trop court (32 caractères minimum)");
  }
  return secret;
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

export type SessionClaims = { userId: string; sessionVersion: number };

/** Cookie = `userId.version.iat.exp.mac`. Les jetons à 4 segments (sans version) valent la version 0. */
export function signSession(
  userId: string,
  secret: string,
  nowMs = Date.now(),
  sessionVersion = 0,
): string {
  if (!userId || userId.includes(".")) throw new Error("invalid session subject");
  if (!Number.isInteger(sessionVersion) || sessionVersion < 0) {
    throw new Error("invalid session version");
  }
  const iat = Math.floor(nowMs / 1000);
  const exp = iat + SESSION_TTL_SEC;
  const body = `${userId}.${sessionVersion}.${iat}.${exp}`;
  return `${body}.${macBody(body, secret)}`;
}

export function readSession(token: string, secret: string, nowMs = Date.now()): SessionClaims | null {
  const parts = token.split(".");
  if (parts.length === 4) {
    const [userId, iatStr, expStr, mac] = parts;
    return verifySession(userId, 0, iatStr, expStr, mac, secret, nowMs, `${userId}.${iatStr}.${expStr}`);
  }
  if (parts.length !== 5) return null;
  const [userId, versionStr, iatStr, expStr, mac] = parts;
  if (!versionStr || !/^\d+$/.test(versionStr)) return null;
  return verifySession(
    userId,
    Number(versionStr),
    iatStr,
    expStr,
    mac,
    secret,
    nowMs,
    `${userId}.${versionStr}.${iatStr}.${expStr}`,
  );
}

function verifySession(
  userId: string | undefined,
  sessionVersion: number,
  iatStr: string | undefined,
  expStr: string | undefined,
  mac: string | undefined,
  secret: string,
  nowMs: number,
  body: string,
): SessionClaims | null {
  if (!userId || !iatStr || !expStr || !mac) return null;
  if (!/^\d+$/.test(iatStr) || !/^\d+$/.test(expStr)) return null;
  const expected = macBody(body, secret);
  if (!safeEqualB64(mac, expected)) return null;

  const iat = Number(iatStr);
  const exp = Number(expStr);
  const now = Math.floor(nowMs / 1000);
  if (!Number.isFinite(iat) || !Number.isFinite(exp)) return null;
  if (exp !== iat + SESSION_TTL_SEC) return null;
  if (iat > now + 60) return null;
  if (exp <= now) return null;
  return { userId, sessionVersion };
}
