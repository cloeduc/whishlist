import { analyticsTargetAllowed } from "@/src/site/analytics-public";

const WEBSITE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type AnalyticsConfig = { websiteId: string; upstream: string };

/** Actif seulement si l'instance a fourni un identifiant et une origine Umami. */
export function analyticsConfig(env: NodeJS.Dict<string> = process.env): AnalyticsConfig | null {
  const websiteId = env.UMAMI_WEBSITE_ID?.trim() ?? "";
  const raw = env.UMAMI_URL?.trim() ?? "";
  if (!WEBSITE_ID.test(websiteId) || !raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  return { websiteId, upstream: url.origin };
}

export function analyticsConfigured(): boolean {
  return analyticsConfig() !== null;
}

const PASS_HEADERS = ["content-type", "user-agent", "accept", "accept-language"] as const;

/** N'envoie pas l'adresse IP ni le cookie de session vers l'outil de mesure. */
export function analyticsUpstreamHeaders(
  input: { get(name: string): string | null },
  websiteId: string,
): Headers {
  const headers = new Headers();
  for (const name of PASS_HEADERS) {
    const value = input.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("x-umami-website-id", websiteId);
  headers.set("x-forwarded-for", "0.0.0.0");
  headers.set("x-real-ip", "0.0.0.0");
  return headers;
}

export const ANALYTICS_PATHS = new Set(["script.js", "api/send"]);

/**
 * Ne relaie qu'une vue de page publique.
 * L'identifiant du site est imposé : le corps reçu ne choisit pas la cible.
 */
export function prepareAnalyticsEvent(
  raw: string,
  websiteId: string,
  hostname: string,
): "drop" | "invalid" | string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return "invalid";
  }
  if (!parsed || typeof parsed !== "object") return "invalid";
  const root = parsed as Record<string, unknown>;
  if (root.type !== "event") return "invalid";
  if (!root.payload || typeof root.payload !== "object") return "invalid";
  const payload = root.payload as Record<string, unknown>;
  if (typeof payload.url !== "string" || payload.url.length > 2048) return "invalid";
  if (!analyticsTargetAllowed(payload.url)) return "drop";
  const url = new URL(payload.url, "https://analytics.invalid").pathname;
  let referrer = "";
  if (typeof payload.referrer === "string" && payload.referrer && analyticsTargetAllowed(payload.referrer)) {
    referrer = new URL(payload.referrer, "https://analytics.invalid").pathname;
  }
  return JSON.stringify({
    type: "event",
    payload: {
      website: websiteId,
      hostname,
      url,
      title: typeof payload.title === "string" ? payload.title.slice(0, 200) : "",
      referrer,
      screen: typeof payload.screen === "string" ? payload.screen.slice(0, 32) : "",
      language: typeof payload.language === "string" ? payload.language.slice(0, 35) : "",
    },
  });
}
