/** Liens publics (self-host, soutien). */
export const GITHUB_REPO_URL = "https://github.com/cloeduc/whishlist";

/**
 * Payment Link Stripe (ex. https://buy.stripe.com/…).
 * Lu côté serveur uniquement — pas besoin de `NEXT_PUBLIC_` (évite un rebuild pour changer le lien).
 */
export function supportUrl(): string | null {
  const raw = (process.env.SUPPORT_URL ?? process.env.WHISHLIST_SUPPORT_URL)?.trim();
  return raw && raw.startsWith("http") ? raw : null;
}
