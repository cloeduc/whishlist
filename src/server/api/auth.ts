import type { NextRequest } from "next/server";
import { findApiSessionUser } from "../../auth/api-session";
import { verifyReadUnlock } from "../../auth/read-unlock";
import { verifyReservationClaims } from "../../auth/reservation-claim";
import { sessionSecret } from "../../auth/session";
import type { User, Wishlist } from "../../domain/types";
import { readDocument } from "../../store/db";

export function bearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match ? match[1]! : null;
}

/** Compte du jeton bearer, ou null (pas de jeton, jeton invalide). */
export async function optionalApiUser(req: NextRequest): Promise<User | null> {
  const token = bearerToken(req);
  if (!token) return null;
  return findApiSessionUser(await readDocument(), token);
}

/** Preuves invité envoyées en en-tête : déverrouillage et claims de réservation. */
export function guestProofs(req: NextRequest, readToken: string) {
  const secret = sessionSecret();
  const unlock = req.headers.get("x-read-unlock");
  const claims = (req.headers.get("x-reservation-claims") ?? "")
    .split(",")
    .map((claim) => claim.trim())
    .filter(Boolean);
  return {
    isUnlocked: (list: Wishlist) => (secret ? verifyReadUnlock(list, unlock, secret) : !list.readPasswordHash),
    claimedIds: secret ? verifyReservationClaims(readToken, claims, secret) : new Set<string>(),
  };
}
