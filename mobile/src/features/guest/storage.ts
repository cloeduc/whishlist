import * as SecureStore from "expo-secure-store";

/**
 * Guest view proofs kept on the phone (011, data-model « Accès invité »): the unlock token of a
 * protected list (`X-Read-Unlock`, 14 days, duration returned by the server) and the claims
 * of reservations made without an account (`X-Reservation-Claims`, 90 days), like the site cookies.
 */
const UNLOCKS = "guest.unlocks";
const CLAIMS = "guest.claims";
const CLAIM_TTL_MS = 90 * 24 * 60 * 60 * 1000;
/** The server reads at most 50 claims per list. */
const MAX_CLAIMS_PER_LIST = 50;

type Unlock = { token: string; expiresAt: string };
type Claim = { claim: string; readToken: string; reservationId: string; expiresAt: string };

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

/** Claims of this list, most recent first. */
export async function claimsFor(readToken: string): Promise<string[]> {
  return (await claims())
    .filter((entry) => entry.readToken === readToken)
    .reverse()
    .slice(0, MAX_CLAIMS_PER_LIST)
    .map((entry) => entry.claim);
}

export async function saveClaim(readToken: string, reservationId: string, claim: string, now = Date.now()): Promise<void> {
  const next = [...(await claims()), { claim, readToken, reservationId, expiresAt: new Date(now + CLAIM_TTL_MS).toISOString() }];
  await SecureStore.setItemAsync(CLAIMS, JSON.stringify(next));
}

/** Reservation cancelled: its claim is no longer needed. */
export async function forgetReservation(reservationId: string): Promise<void> {
  const next = (await claims()).filter((entry) => entry.reservationId !== reservationId);
  await SecureStore.setItemAsync(CLAIMS, JSON.stringify(next));
}

/** Sign-out or account deletion: the phone also forgets the guest access. */
export async function clearGuestAccess(): Promise<void> {
  await Promise.all([SecureStore.deleteItemAsync(UNLOCKS), SecureStore.deleteItemAsync(CLAIMS)]);
}
