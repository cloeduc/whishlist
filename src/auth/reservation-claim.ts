import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { cookieSecure } from "./current";
import { sessionSecret } from "./session";

const TTL_SEC = 60 * 60 * 24 * 90; // 90 jours

function cookieName(readToken: string): string {
  const digest = createHmac("sha256", "wl-res-claim").update(readToken).digest("base64url").slice(0, 16);
  return `wl_rc_${digest}`;
}

function macClaims(readToken: string, iat: number, idsCsv: string, secret: string): string {
  return createHmac("sha256", secret).update(`${readToken}.${iat}.${idsCsv}`).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function parseClaims(raw: string | undefined, readToken: string, secret: string, nowMs = Date.now()): string[] {
  if (!raw) return [];
  const parts = raw.split(".");
  if (parts.length !== 3) return [];
  const [iatStr, idsCsv, mac] = parts;
  if (!iatStr || mac === undefined || !/^\d+$/.test(iatStr)) return [];
  const iat = Number(iatStr);
  const now = Math.floor(nowMs / 1000);
  if (iat > now + 60 || now - iat > TTL_SEC) return [];
  const expected = macClaims(readToken, iat, idsCsv ?? "", secret);
  if (!safeEqual(mac, expected)) return [];
  if (!idsCsv) return [];
  return idsCsv.split(",").filter(Boolean);
}

/** Claims lus par requête au plus (en-tête `X-Reservation-Claims` de l'API). */
const MAX_CLAIMS = 50;

/**
 * Preuve d'une réservation pour un client sans cookie : `iat.reservationId.mac`.
 * Même format et même durée que le cookie, avec un seul id.
 */
export function signReservationClaim(
  readToken: string,
  reservationId: string,
  secret: string,
  nowMs = Date.now(),
): string {
  const iat = Math.floor(nowMs / 1000);
  return `${iat}.${reservationId}.${macClaims(readToken, iat, reservationId, secret)}`;
}

/** Ids des réservations prouvées par ces claims (les autres sont ignorés). */
export function verifyReservationClaims(
  readToken: string,
  claims: readonly string[],
  secret: string,
  nowMs = Date.now(),
): Set<string> {
  const ids = new Set<string>();
  for (const claim of claims.slice(0, MAX_CLAIMS)) {
    const parsed = parseClaims(claim, readToken, secret, nowMs);
    if (parsed.length === 1) ids.add(parsed[0]!);
  }
  return ids;
}

/** Enregistre une réservation comme « mienne » dans ce navigateur. */
export async function grantReservationClaim(readToken: string, reservationId: string): Promise<void> {
  const secret = sessionSecret();
  if (!secret || !reservationId) return;
  const jar = await cookies();
  const name = cookieName(readToken);
  const existing = parseClaims(jar.get(name)?.value, readToken, secret);
  const nextIds = [...new Set([...existing, reservationId])].sort();
  const iat = Math.floor(Date.now() / 1000);
  const idsCsv = nextIds.join(",");
  const mac = macClaims(readToken, iat, idsCsv, secret);
  jar.set(name, `${iat}.${idsCsv}.${mac}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    maxAge: TTL_SEC,
  });
}

export async function revokeReservationClaim(readToken: string, reservationId: string): Promise<void> {
  const secret = sessionSecret();
  if (!secret) return;
  const jar = await cookies();
  const name = cookieName(readToken);
  const existing = parseClaims(jar.get(name)?.value, readToken, secret);
  const nextIds = existing.filter((id) => id !== reservationId).sort();
  if (nextIds.length === 0) {
    jar.delete(name);
    return;
  }
  const iat = Math.floor(Date.now() / 1000);
  const idsCsv = nextIds.join(",");
  const mac = macClaims(readToken, iat, idsCsv, secret);
  jar.set(name, `${iat}.${idsCsv}.${mac}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    maxAge: TTL_SEC,
  });
}

export async function listClaimedReservationIds(readToken: string): Promise<Set<string>> {
  const secret = sessionSecret();
  if (!secret) return new Set();
  const jar = await cookies();
  return new Set(parseClaims(jar.get(cookieName(readToken))?.value, readToken, secret));
}
