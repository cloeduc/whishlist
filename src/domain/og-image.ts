import { fetchPageHtml } from "./fetch-page";

function metaContent(html: string, attr: "property" | "name" | "itemprop", key: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+${attr}=["']${key}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${key}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

function linkHref(html: string, rel: string): string | null {
  const patterns = [
    new RegExp(`<link[^>]+rel=["']${rel}["'][^>]+href=["']([^"']+)["']`, "i"),
    new RegExp(`<link[^>]+href=["']([^"']+)["'][^>]+rel=["']${rel}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

function jsonLdImage(html: string): string | null {
  const blocks = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const block of blocks) {
    const raw = block[1]?.trim();
    if (!raw) continue;
    try {
      const found = pickImageFromJson(JSON.parse(raw));
      if (found) return found;
    } catch {
      // ignore malformed JSON-LD
    }
  }
  return null;
}

function pickImageFromJson(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = pickImageFromJson(entry);
      if (found) return found;
    }
    return null;
  }
  const record = value as Record<string, unknown>;
  const image = record.image;
  if (typeof image === "string" && image.trim()) return image.trim();
  if (Array.isArray(image)) {
    for (const entry of image) {
      if (typeof entry === "string" && entry.trim()) return entry.trim();
      if (entry && typeof entry === "object" && typeof (entry as { url?: unknown }).url === "string") {
        return String((entry as { url: string }).url).trim();
      }
    }
  }
  if (image && typeof image === "object" && typeof (image as { url?: unknown }).url === "string") {
    return String((image as { url: string }).url).trim();
  }
  if (record["@graph"]) return pickImageFromJson(record["@graph"]);
  return null;
}

function absoluteUrl(raw: string, pageUrl: string): string | null {
  try {
    return new URL(raw, pageUrl).toString();
  } catch {
    return null;
  }
}

export function extractOgImage(html: string, pageUrl: string): string | null {
  const raw =
    metaContent(html, "property", "og:image") ??
    metaContent(html, "property", "og:image:url") ??
    metaContent(html, "property", "og:image:secure_url") ??
    metaContent(html, "name", "twitter:image") ??
    metaContent(html, "name", "twitter:image:src") ??
    metaContent(html, "itemprop", "image") ??
    linkHref(html, "image_src") ??
    jsonLdImage(html);
  if (!raw) return null;
  return absoluteUrl(raw, pageUrl);
}

export async function fetchOgImage(pageUrl: string): Promise<string | null> {
  const page = await fetchPageHtml(pageUrl, 8_000);
  if (!page) return null;
  return extractOgImage(page.html, page.finalUrl);
}
