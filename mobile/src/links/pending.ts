import { useLocalSearchParams, type Href } from "expo-router";
import { useEffect } from "react";

import { appPathForUrl } from "./routes";

/**
 * Link that requires being signed in (invitation), kept during sign-in or sign-up (feature 011, R5).
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

/**
 * Sign-in or sign-up opened by `/login?next=/invite/…` (site link, or its former French form
 * `/connexion?next=/inviter/…`): the invitation is kept, as if its link had been opened.
 * Other `next` values are ignored.
 */
export function useNextLink(): void {
  const { next } = useLocalSearchParams<{ next?: string }>();
  useEffect(() => {
    if (typeof next !== "string") return;
    const path = appPathForUrl(next);
    if (path?.startsWith("/links/invite/")) setPendingLink(path);
  }, [next]);
}
