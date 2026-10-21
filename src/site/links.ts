import { getInstanceSupportUrl } from "@/src/site/instance-content";

/** Liens publics (self-host, soutien). */
export const GITHUB_REPO_URL = "https://github.com/cloeduc/whishlist";

/**
 * Payment Link Stripe (ex. https://buy.stripe.com/…).
 * Priorite : instance-content.json, puis SUPPORT_URL / WHISHLIST_SUPPORT_URL.
 * Lu cote serveur uniquement — pas besoin de NEXT_PUBLIC_.
 */
export function supportUrl(): string | null {
  const fromInstance = getInstanceSupportUrl();
  if (fromInstance) return fromInstance;
  const raw = (process.env.SUPPORT_URL ?? process.env.WHISHLIST_SUPPORT_URL)?.trim();
  return raw && raw.startsWith("http") ? raw : null;
}
