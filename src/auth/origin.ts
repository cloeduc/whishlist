/** Origine canonique pour liens mails / partage — jamais dérivée des headers si `APP_ORIGIN` est set. */

export function normalizeAppOrigin(raw: string): string | null {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    if (url.pathname !== "/" && url.pathname !== "") return null;
    if (url.search || url.hash) return null;
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

export function originFromEnv(env?: {
  APP_ORIGIN?: string;
  WHISHLIST_APP_ORIGIN?: string;
}): string | null {
  const source = env ?? {
    APP_ORIGIN: process.env.APP_ORIGIN,
    WHISHLIST_APP_ORIGIN: process.env.WHISHLIST_APP_ORIGIN,
  };
  const raw = source.APP_ORIGIN ?? source.WHISHLIST_APP_ORIGIN;
  if (!raw) return null;
  return normalizeAppOrigin(raw);
}

/** Fallback headers (dev / legacy). Ne pas utiliser si un APP_ORIGIN valide existe. */
export function originFromHeaders(input: {
  host: string | null;
  forwardedHost: string | null;
  forwardedProto: string | null;
}): string {
  const host = (input.forwardedHost ?? input.host ?? "localhost:3000").split(",")[0]!.trim();
  const proto = (input.forwardedProto ?? "http").split(",")[0]!.trim() || "http";
  return `${proto}://${host}`;
}
