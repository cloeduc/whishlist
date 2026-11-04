import { setPendingLink } from "@/links/pending";
import { appPathForUrl } from "@/links/routes";

/** Link of a received share (`ohyoushouldnt://expo-sharing`); a relative path is not one. */
function isShare(path: string): boolean {
  try {
    return new URL(path).hostname === "expo-sharing";
  } catch {
    return false;
  }
}

/**
 * Address received by the app (feature 011) → screen: the site's `/reinitialiser/<jeton>` becomes
 * `/links/reset-password/<jeton>`. An unknown address opens the home screen. Never throws (an error here
 * crashes the app) and does not write the address, which carries a token, to the console.
 *
 * A share received from another app (expo-sharing: `…://expo-sharing`) opens « Ajouter à une liste ». It is kept
 * as a pending link: without a session, sign-in leads back to it afterwards.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    if (isShare(path)) {
      setPendingLink("/share");
      return "/share";
    }
    return appPathForUrl(path) ?? "/";
  } catch {
    return "/";
  }
}
