import { getInstanceSupportUrl } from "@/src/site/instance-content";

/** Public links (self-host, support). */
export const GITHUB_REPO_URL = "https://github.com/cloeduc/whishlist";

/**
 * Stripe Payment Link (e.g. https://buy.stripe.com/…).
 * Priority: instance-content.json, then SUPPORT_URL / WHISHLIST_SUPPORT_URL.
 * Read on the server only — no need for NEXT_PUBLIC_.
 */
export function supportUrl(): string | null {
  const fromInstance = getInstanceSupportUrl();
  if (fromInstance) return fromInstance;
  const raw = (process.env.SUPPORT_URL ?? process.env.WHISHLIST_SUPPORT_URL)?.trim();
  return raw && raw.startsWith("http") ? raw : null;
}

/** `https://` address from a variable, otherwise `null`. */
function httpsUrl(raw: string | undefined): string | null {
  const value = raw?.trim();
  return value && value.startsWith("https://") ? value : null;
}

/** The app's App Store page (`APP_STORE_URL`), offered by the site icon on a phone (011). */
export function appStoreUrl(): string | null {
  return httpsUrl(process.env.APP_STORE_URL);
}

/** The app's Google Play page (`PLAY_STORE_URL`). */
export function playStoreUrl(): string | null {
  return httpsUrl(process.env.PLAY_STORE_URL);
}
