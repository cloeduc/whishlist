import * as SecureStore from "expo-secure-store";

/**
 * Guest view proofs kept on the phone (011, data-model « Accès invité »): the unlock token of a
 * protected list (`X-Read-Unlock`, 14 days, duration returned by the server) and the claims
 * of reservations made without an account (`X-Reservation-Claims`, 90 days), like the site cookies.
 */
const UNLOCKS = "guest.unlocks";
const CLAIMS = "guest.claims";
/** Claim key of each list or group gift already seen (028): `list:<readToken>` or `gift:<token>`. */
const CLAIM_KEYS = "guest.claimKeys";
const CLAIM_TTL_MS = 90 * 24 * 60 * 60 * 1000;
/** The server reads at most 50 claims per list. */
const MAX_CLAIMS_PER_LIST = 50;

type Unlock = { token: string; expiresAt: string };
/**
 * A claim is filed under the list's read link when the app knows it, and under the list's opaque
 * `claimKey` and the group gift's token when it came through a gift's link (028): that link never
 * gives the list's read link.
 */
type Claim = {
  claim: string;
  readToken: string | null;
  claimKey?: string | null;
  giftToken?: string | null;
  reservationId: string;
  expiresAt: string;
};

/** Where a claim belongs: a list by its read link, a group gift by its token, and/or the list's claim key. */
export type ClaimScope = { readToken?: string | null; giftToken?: string | null; claimKey?: string | null };

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await SecureStore.getItemAsync(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function alive(expiresAt: string, now = Date.now()): boolean {
  return Date.parse(expiresAt) > now;
}

async function unlocks(): Promise<Record<string, Unlock>> {
  const all = await readJson<Record<string, Unlock>>(UNLOCKS, {});
  return Object.fromEntries(Object.entries(all).filter(([, unlock]) => alive(unlock.expiresAt)));
}

async function claims(): Promise<Claim[]> {
  return (await readJson<Claim[]>(CLAIMS, [])).filter((claim) => alive(claim.expiresAt));
}

/** Unlock token still valid for this list, otherwise `null`. */
export async function unlockTokenFor(readToken: string): Promise<string | null> {
  return (await unlocks())[readToken]?.token ?? null;
}

export async function saveUnlock(readToken: string, token: string, expiresAt: string): Promise<void> {
  await SecureStore.setItemAsync(UNLOCKS, JSON.stringify({ ...(await unlocks()), [readToken]: { token, expiresAt } }));
}

/** Token refused (password changed, `readPasswordRequired`): forget it. */
export async function forgetUnlock(readToken: string): Promise<void> {
  const { [readToken]: _dropped, ...rest } = await unlocks();
  await SecureStore.setItemAsync(UNLOCKS, JSON.stringify(rest));
}

async function claimKeys(): Promise<Record<string, string>> {
  return readJson<Record<string, string>>(CLAIM_KEYS, {});
}

/** The claim key a list or group gift answered with (028), to send the claims filed under it next time. */
export async function rememberClaimKey(scope: { readToken?: string; giftToken?: string }, claimKey: string): Promise<void> {
  const name = scope.readToken ? `list:${scope.readToken}` : scope.giftToken ? `gift:${scope.giftToken}` : null;
  if (!name) return;
  const known = await claimKeys();
  if (known[name] === claimKey) return;
  await SecureStore.setItemAsync(CLAIM_KEYS, JSON.stringify({ ...known, [name]: claimKey }));
}

/** Claims of a list or a group gift, most recent first: filed under its link, its token or its claim key. */
export async function claimsForScope(scope: { readToken?: string; giftToken?: string }): Promise<string[]> {
  const known = await claimKeys();
  const key = scope.readToken ? known[`list:${scope.readToken}`] : scope.giftToken ? known[`gift:${scope.giftToken}`] : undefined;
  return (await claims())
    .filter(
      (entry) =>
        (scope.readToken && entry.readToken === scope.readToken) ||
        (scope.giftToken && entry.giftToken === scope.giftToken) ||
        (key && entry.claimKey === key),
    )
    .reverse()
    .slice(0, MAX_CLAIMS_PER_LIST)
    .map((entry) => entry.claim);
}

/** Claims of this list, most recent first. */
export async function claimsFor(readToken: string): Promise<string[]> {
  return claimsForScope({ readToken });
}

export async function saveClaim(
  scope: string | ClaimScope,
  reservationId: string,
  claim: string,
  now = Date.now(),
): Promise<void> {
  const where: ClaimScope = typeof scope === "string" ? { readToken: scope } : scope;
  const entry: Claim = {
    claim,
    readToken: where.readToken ?? null,
    claimKey: where.claimKey ?? null,
    giftToken: where.giftToken ?? null,
    reservationId,
    expiresAt: new Date(now + CLAIM_TTL_MS).toISOString(),
  };
  await SecureStore.setItemAsync(CLAIMS, JSON.stringify([...(await claims()), entry]));
}

/** Reservation cancelled: its claim is no longer needed. */
export async function forgetReservation(reservationId: string): Promise<void> {
  const next = (await claims()).filter((entry) => entry.reservationId !== reservationId);
  await SecureStore.setItemAsync(CLAIMS, JSON.stringify(next));
}

/** Sign-out or account deletion: the phone also forgets the guest access. */
export async function clearGuestAccess(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(UNLOCKS),
    SecureStore.deleteItemAsync(CLAIMS),
    SecureStore.deleteItemAsync(CLAIM_KEYS),
  ]);
}
