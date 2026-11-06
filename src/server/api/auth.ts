import "server-only";
import type { NextRequest } from "next/server";
import { findApiKey, isApiKeyToken } from "../../auth/api-keys";
import { touchApiKey } from "../../domain/api-keys";
import { findApiSessionUser } from "../../auth/api-session";
import { verifyReadUnlock } from "../../auth/read-unlock";
import { verifyReservationClaims } from "../../auth/reservation-claim";
import { sessionSecret } from "../../auth/session";
import type { User, Wishlist } from "../../domain/types";
import { readDocument, updateDocument } from "../../store/db";
import { bucketExhausted, RateLimitError, rateLimitForIp, takeToken } from "../rate-limit";

/** Token of an `Authorization: Bearer …` header, or null. */
export function bearerFrom(header: string | null): string | null {
  const match = /^Bearer\s+(\S+)$/i.exec((header ?? "").trim());
  return match ? match[1]! : null;
}

export function bearerToken(req: NextRequest): string | null {
  return bearerFrom(req.headers.get("authorization"));
}

/** Requests per minute per API key, on top of the per-action limits. */
export const API_KEY_RATE = { limit: 120, windowMs: 60 * 1000 };

/**
 * Failures per IP (unknown or revoked `oys_…` key) before refusal: the sign-in failure budget
 * (`login`, 20 per 15 minutes). Only failures count: a valid key does not use up this budget.
 */
export const API_KEY_FAILURE_RATE = { limit: 20, windowMs: 15 * 60 * 1000 };
const API_KEY_FAILURE_SCOPE = "api-key-failure";

/** An API key (`oys_…`) rather than an app session token. */
export function usesApiKey(req: NextRequest): boolean {
  const token = bearerToken(req);
  return token !== null && isApiKeyToken(token);
}

/**
 * Account of an API key, or null. Rate-limits the key and records its use (at most one write
 * per hour). Used by the MCP server, the only one to accept a key.
 *
 * An unknown or revoked key counts a failure for the IP (`ip`, the proxy's). Once its failures are used up,
 * the IP is refused (`rateLimited`) before any lookup, so no more keys can be tried from it.
 * Without a trusted IP, same rule as `rateLimitForIp`: in production a failure is refused.
 */
export async function apiKeyUser(token: string, ip: string | null = null): Promise<User | null> {
  if (ip && bucketExhausted(`${API_KEY_FAILURE_SCOPE}:${ip}`, API_KEY_FAILURE_RATE.limit)) {
    throw new RateLimitError(API_KEY_FAILURE_SCOPE);
  }
  const current = await readDocument();
  const found = findApiKey(current, token);
  if (!found) {
    rateLimitForIp(API_KEY_FAILURE_SCOPE, ip, API_KEY_FAILURE_RATE.limit, API_KEY_FAILURE_RATE.windowMs);
    return null;
  }
  if (!takeToken(`api-key:${found.key.id}`, API_KEY_RATE.limit, API_KEY_RATE.windowMs)) {
    throw new RateLimitError("api-key");
  }
  // `touchApiKey` only tells whether to write; the write replays it on the transaction's document.
  if (touchApiKey(current, found.key.id)) {
    await updateDocument((doc) => ({ doc: touchApiKey(doc, found.key.id) ?? doc, result: null }));
  }
  return found.user;
}

/**
 * Account of the app session token, or null (no token, invalid token). An API key does not count here:
 * `withApi` refuses it earlier (`apiKeyNotAllowed`), it only opens the MCP server.
 */
export async function optionalApiUser(req: NextRequest): Promise<User | null> {
  const token = bearerToken(req);
  if (!token || isApiKeyToken(token)) return null;
  return findApiSessionUser(await readDocument(), token);
}

/** Guest proofs sent as headers: unlock and reservation claims. */
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
