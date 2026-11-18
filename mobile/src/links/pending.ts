import { useLocalSearchParams, type Href } from "expo-router";
import { useEffect } from "react";

import { useSession, type SessionState } from "@/auth/session";

import { appPathForUrl } from "./routes";

/**
 * Link that requires being signed in (invitation, a list's management address), kept during sign-in
 * or sign-up (feature 011, R5).
 * In memory: after the app is killed, the person opens the link again. The last opened link wins.
 * Session guards read it during render (without clearing it); the link screen clears it on arrival.
 */
let pending: string | null = null;

export function setPendingLink(path: string): void {
  pending = path;
}

/** Where to go once the session is open: the pending link, otherwise home. */
export function afterSignIn(): Href {
  return (pending ?? "/") as Href;
}

export function clearPendingLink(): void {
  pending = null;
}

/** Link screens worth coming back to after sign-in: an invitation, a list's management address (026). */
const RESUMABLE_LINKS = ["/links/invite/", "/links/list/"];

/**
 * Sign-in or sign-up opened by `/login?next=/invite/…` or `/login?next=/lists/…` (site link, or its
 * former French form `/connexion?next=/listes/…`): that link is kept, as if it had been opened.
 * Other `next` values are ignored.
 */
export function useNextLink(): void {
  const { next } = useLocalSearchParams<{ next?: string }>();
  useEffect(() => {
    if (typeof next !== "string") return;
    const path = appPathForUrl(next);
    if (path && RESUMABLE_LINKS.some((prefix) => path.startsWith(prefix))) setPendingLink(path);
  }, [next]);
}

/**
 * For a link screen that needs a session (invitation, a list's management address): while signed out
 * or before the forced password change, `self` is kept to come back to after sign-in; once signed in,
 * it is cleared. Returns the session, for the screen to choose what to show.
 */
export function useResumableLink(self: string): SessionState {
  const session = useSession();
  const signedIn = session.status === "signedIn";
  useEffect(() => {
    if (session.status === "signedOut" || session.status === "mustChangePassword") setPendingLink(self);
    else if (signedIn) clearPendingLink();
  }, [session.status, signedIn, self]);
  return session;
}
