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
  if (!pageUrl.startsWith("http://") && !pageUrl.startsWith("https://")) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(pageUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
    });
    if (!response.ok) return null;
    const type = response.headers.get("content-type") ?? "";
    if (type && !type.includes("html") && !type.includes("text/") && !type.includes("xml")) return null;
    const html = (await response.text()).slice(0, 400_000);
    return extractOgImage(html, response.url || pageUrl);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
