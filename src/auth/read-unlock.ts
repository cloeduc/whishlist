import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { cookieSecure } from "./current";
import { sessionSecret } from "./session";
import type { Wishlist } from "../domain/types";

const TTL_SEC = 60 * 60 * 24 * 14; // 14 jours

function cookieName(readToken: string): string {
  // Nom court stable (tokens trop longs pour un cookie name).
  const digest = createHmac("sha256", "wl-read-name").update(readToken).digest("base64url").slice(0, 16);
  return `wl_ru_${digest}`;
}

function macUnlock(readToken: string, passwordHash: string, secret: string): string {
  return createHmac("sha256", secret).update(`${readToken}.${passwordHash}`).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** Durée d'un déverrouillage, cookie du site comme jeton de l'API. */
export const READ_UNLOCK_TTL_SEC = TTL_SEC;

/** Preuve de déverrouillage `iat.mac`, liée au hash courant (invalide si le MDP change). */
export function signReadUnlock(list: Wishlist, secret: string, nowMs = Date.now()): string {
  const iat = Math.floor(nowMs / 1000);
  return `${iat}.${macUnlock(list.readToken, list.readPasswordHash ?? "", secret)}`;
}

export function verifyReadUnlock(
  list: Wishlist,
  raw: string | null | undefined,
  secret: string,
  nowMs = Date.now(),
): boolean {
  if (!list.readPasswordHash) return true;
  if (!raw) return false;
  const dot = raw.indexOf(".");
  if (dot <= 0) return false;
  const iatStr = raw.slice(0, dot);
  const mac = raw.slice(dot + 1);
  if (!/^\d+$/.test(iatStr) || !mac) return false;
  const iat = Number(iatStr);
  const now = Math.floor(nowMs / 1000);
  if (iat > now + 60 || now - iat > TTL_SEC) return false;
  const expected = macUnlock(list.readToken, list.readPasswordHash, secret);
  return safeEqual(mac, expected);
}

export async function grantReadUnlock(list: Wishlist): Promise<void> {
  const secret = sessionSecret();
  if (!secret || !list.readPasswordHash) return;
  const jar = await cookies();
  jar.set(cookieName(list.readToken), signReadUnlock(list, secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    maxAge: TTL_SEC,
  });
}

export async function clearReadUnlock(readToken: string): Promise<void> {
  const jar = await cookies();
  jar.delete(cookieName(readToken));
}

export async function hasReadUnlock(list: Wishlist): Promise<boolean> {
  if (!list.readPasswordHash) return true;
  const secret = sessionSecret();
  if (!secret) return false;
  const jar = await cookies();
  return verifyReadUnlock(list, jar.get(cookieName(list.readToken))?.value, secret);
}
