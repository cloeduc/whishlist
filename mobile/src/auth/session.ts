import * as SecureStore from "expo-secure-store";
import { useSyncExternalStore } from "react";
import { AppState } from "react-native";

import { api, configureClient, done, NetworkError, ok, type Schemas } from "@/api/client";
import { resetStore } from "@/data/store";
import { removeExportFiles } from "@/features/account/exportData";
import { clearGuestAccess } from "@/features/guest/storage";
import { currentLocale } from "@/i18n";
import { clearAll, ensureUser, getSnapshot, putSnapshot } from "@/offline/snapshot";

type Me = Schemas["Me"];

export type SessionState =
  | { status: "loading" }
  | { status: "signedOut"; expired: boolean; deleted?: boolean }
  | { status: "mustChangePassword"; user: Me }
  | { status: "signedIn"; user: Me | null };

// Secure storage keys (data-model.md, « Connexion »).
const TOKEN = "session.token";
const EXPIRES_AT = "session.expiresAt";
const USER_ID = "session.userId";
// The account is kept in the local copy to show it offline.
const ME = "me";

let token: string | null = null;
let state: SessionState = { status: "loading" };
const listeners = new Set<() => void>();

function setState(next: SessionState) {
  state = next;
  for (const listener of listeners) listener();
}

export function getSession(): SessionState {
  return state;
}

export function onSessionChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSession(): SessionState {
  return useSyncExternalStore(onSessionChange, getSession);
}

async function forgetToken() {
  token = null;
  await Promise.all([TOKEN, EXPIRES_AT, USER_ID].map((key) => SecureStore.deleteItemAsync(key)));
}

function stateFor(user: Me): SessionState {
  return user.mustChangePassword ? { status: "mustChangePassword", user } : { status: "signedIn", user };
}

// A 401 while signed in: the session expired or was revoked (FR-004).
// Pending changes are kept for when the same account signs in again.
configureClient({
  getToken: () => token,
  getLocale: currentLocale,
  onUnauthorized: () => {
    if (!token) return;
    void forgetToken().then(() => setState({ status: "signedOut", expired: true }));
  },
});

/** At startup: stored token → signed in right away, then checked with `GET /me` (R3). */
export async function restore(): Promise<void> {
  const [stored, expiresAt, userId] = await Promise.all(
    [TOKEN, EXPIRES_AT, USER_ID].map((key) => SecureStore.getItemAsync(key)),
  );
  if (!stored || !userId || (expiresAt && Date.parse(expiresAt) <= Date.now())) {
    await forgetToken();
    setState({ status: "signedOut", expired: false });
    return;
  }
  token = stored;
  await ensureUser(userId);
  const cached = await getSnapshot<Me>(ME);
  setState(cached ? stateFor(cached.body) : { status: "signedIn", user: null });
  await refreshMe();
}

/** Reloads the account; without network, keeps the current state. */
export async function refreshMe(): Promise<void> {
  if (!token) return;
  try {
    const me = await ok(api.GET("/me"));
    await putSnapshot(ME, me);
    setState(stateFor(me));
  } catch (error) {
    // 401: already handled by onUnauthorized. Network: we stay on the copy.
    if (error instanceof NetworkError) return;
    if (!token) return;
    throw error;
  }
}

// When back in the foreground: the account may have changed elsewhere (address confirmed in the browser, 010).
AppState.addEventListener("change", (status) => {
  if (status === "active") refreshMe().catch(() => undefined);
});

/** Saves the session returned by login, register or /me/password. */
export async function signIn(session: Schemas["Session"]): Promise<void> {
  await ensureUser(session.user.id);
  await Promise.all([
    SecureStore.setItemAsync(TOKEN, session.token),
    SecureStore.setItemAsync(EXPIRES_AT, session.expiresAt),
    SecureStore.setItemAsync(USER_ID, session.user.id),
  ]);
  token = session.token;
  await putSnapshot(ME, session.user);
  setState(stateFor(session.user));
}

/** Updates the displayed account (name changed). */
export async function updateMe(me: Me): Promise<void> {
  await putSnapshot(ME, me);
  setState(stateFor(me));
}

/** Forgets everything on the phone: token, local copy, export files in the cache. */
async function forgetEverything(next: SessionState): Promise<void> {
  await forgetToken();
  await clearAll();
  removeExportFiles();
  resetStore();
  setState(next);
}

/** Revokes the session on the server if possible (FR-003), then forgets everything on the phone. */
export async function signOut(): Promise<void> {
  try {
    await api.POST("/auth/logout");
  } catch {
    // Offline: the token will expire on its own; we forget it anyway.
  }
  // Only on sign-out and account deletion, not on expiry: the claims are used to cancel
  // a reservation made as a guest (011).
  await clearGuestAccess();
  await forgetEverything({ status: "signedOut", expired: false });
}

/**
 * Deletes the account on the server (password required), then wipes everything on the phone,
 * like `signOut` but without `/auth/logout`: the token is already worthless (R9).
 * An error (wrong password, network…) is thrown and changes nothing.
 */
export async function deleteAccount(password: string): Promise<void> {
  await done(api.POST("/me/deletion", { body: { password } }));
  await clearGuestAccess();
  await forgetEverything({ status: "signedOut", expired: false, deleted: true });
}
