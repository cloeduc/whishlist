import { extractOgImage } from "./og-image";

export type ProductHints = {
  name: string | null;
  price: string | null;
  imageUrl: string | null;
  typeId: string | null;
};

function metaContent(html: string, attr: "property" | "name" | "itemprop", key: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+${attr}=["']${key}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${key}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1].trim());
  }
  return null;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function pageTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match?.[1]) return null;
  const title = decodeHtml(match[1].replace(/\s+/g, " ").trim());
  return title || null;
}

function normalizePrice(raw: string | number | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  let text = String(raw).trim().replace(/[^\d,.\-]/g, "");
  if (!text) return null;
  if (text.includes(",") && text.includes(".")) {
    text =
      text.lastIndexOf(",") > text.lastIndexOf(".")
        ? text.replace(/\./g, "").replace(",", ".")
        : text.replace(/,/g, "");
  } else if (text.includes(",")) {
    text = text.replace(",", ".");
  }
  const value = Number(text);
  if (!Number.isFinite(value) || value < 0) return null;
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

function pickFromJsonLd(value: unknown, pageUrl: string): ProductHints {
  const empty: ProductHints = { name: null, price: null, imageUrl: null, typeId: null };
  if (!value || typeof value !== "object") return empty;
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = pickFromJsonLd(entry, pageUrl);
      if (found.name || found.price || found.imageUrl) return found;
    }
    return empty;
  }
  const record = value as Record<string, unknown>;
  if (record["@graph"]) return pickFromJsonLd(record["@graph"], pageUrl);

  const type = record["@type"];
  const types = Array.isArray(type) ? type.map(String) : type ? [String(type)] : [];
  const isProduct = types.some((t) => /product/i.test(t));
  if (!isProduct && !record.name && !record.offers) {
    return empty;
  }

  const name = typeof record.name === "string" ? decodeHtml(record.name.trim()) || null : null;
  let price: string | null = null;
  const offers = record.offers;
  if (offers && typeof offers === "object") {
    const offerList = Array.isArray(offers) ? offers : [offers];
    for (const offer of offerList) {
      if (!offer || typeof offer !== "object") continue;
      const o = offer as Record<string, unknown>;
      price = normalizePrice(o.price as string | number | undefined);
      if (price) break;
      if (o.priceSpecification && typeof o.priceSpecification === "object") {
        price = normalizePrice((o.priceSpecification as { price?: string | number }).price);
        if (price) break;
      }
    }
  }

  let imageUrl: string | null = null;
  const image = record.image;
  if (typeof image === "string" && image.trim()) {
    try {
      imageUrl = new URL(image.trim(), pageUrl).toString();
    } catch {
      imageUrl = null;
    }
  } else if (Array.isArray(image)) {
    for (const entry of image) {
      if (typeof entry === "string" && entry.trim()) {
        try {
          imageUrl = new URL(entry.trim(), pageUrl).toString();
          break;
        } catch {
          // continue
        }
      }
      if (entry && typeof entry === "object" && typeof (entry as { url?: unknown }).url === "string") {
        try {
          imageUrl = new URL(String((entry as { url: string }).url).trim(), pageUrl).toString();
          break;
        } catch {
          // continue
        }
      }
    }
  } else if (image && typeof image === "object" && typeof (image as { url?: unknown }).url === "string") {
    try {
      imageUrl = new URL(String((image as { url: string }).url).trim(), pageUrl).toString();
    } catch {
      imageUrl = null;
    }
  }

  return { name, price, imageUrl, typeId: null };
}

function jsonLdHints(html: string, pageUrl: string): ProductHints {
  const blocks = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const block of blocks) {
    const raw = block[1]?.trim();
    if (!raw) continue;
    try {
      const found = pickFromJsonLd(JSON.parse(raw), pageUrl);
      if (found.name || found.price || found.imageUrl) return found;
    } catch {
      // ignore
    }
  }
  return { name: null, price: null, imageUrl: null, typeId: null };
}

export function extractProductHints(html: string, pageUrl: string): ProductHints {
  const ld = jsonLdHints(html, pageUrl);
  const name =
    ld.name ??
    metaContent(html, "property", "og:title") ??
    metaContent(html, "name", "twitter:title") ??
    metaContent(html, "itemprop", "name") ??
    pageTitle(html);
  const price =
    ld.price ??
    normalizePrice(metaContent(html, "property", "product:price:amount")) ??
    normalizePrice(metaContent(html, "property", "og:price:amount")) ??
    normalizePrice(metaContent(html, "itemprop", "price")) ??
    normalizePrice(metaContent(html, "name", "price"));
  const imageUrl = ld.imageUrl ?? extractOgImage(html, pageUrl);
  return {
    name: name?.trim() || null,
    price,
    imageUrl,
    typeId: null,
  };
}

export function mergeHints(base: ProductHints, extra: Partial<ProductHints>): ProductHints {
  return {
    name: (extra.name?.trim() || base.name)?.trim() || null,
    price: normalizePrice(extra.price) ?? base.price,
    imageUrl: (extra.imageUrl?.trim() || base.imageUrl)?.trim() || null,
    typeId: extra.typeId?.trim() || base.typeId,
  };
}

export function resolveTypeId(
  types: { id: string; label: string }[],
  typeLabel: string | null | undefined,
): string | null {
  const wanted = (typeLabel ?? "").trim().toLowerCase();
  if (!wanted) return null;
  const exact = types.find((type) => type.label.trim().toLowerCase() === wanted);
  if (exact) return exact.id;
  const byId = types.find((type) => type.id === typeLabel?.trim());
  return byId?.id ?? null;
}
