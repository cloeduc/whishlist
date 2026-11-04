import type { SharePayload } from "expo-sharing";

/** What a share offers for a new idea: a link, and the surrounding text as name. */
export type SharedIdea = { url: string; name: string };

const URL_PATTERN = /https?:\/\/[^\s<>"']+/i;
/** Punctuation stuck to the link in a sentence (« … ici : https://x.fr/a). »): not part of the address. */
const URL_TAIL = /[).,;:!?»”'"]+$/;
/** Separators left around the name once the link is removed (« Lampe – https://… », « "Lampe" | Boutique »). */
const EDGES = /^[\s\-–—|:,;"'«“”»]+|[\s\-–—|:,;"'«“”»]+$/g;
const MAX_NAME = 200;
/** Beyond this, it is no longer the address of a gift page (a tracking link, pasted data): ignore it. */
const MAX_URL = 2048;

/** The server only accepts lowercase `http://` and `https://`: « HTTPS://… » is brought back to this form. */
function normalizeScheme(url: string): string {
  return url.replace(/^https?/i, (scheme) => scheme.toLowerCase());
}

/**
 * Reads the shared contents: the first http(s) link (from a URL share or found in a text, scheme in
 * lowercase, ignored beyond 2048 characters),
 * and the rest of the text, cleaned, as suggested name. Returns null if there is neither link nor text (image only…).
 */
export function sharedIdea(payloads: readonly SharePayload[]): SharedIdea | null {
  let url = "";
  const texts: string[] = [];
  for (const payload of payloads) {
    if (payload.shareType && payload.shareType !== "text" && payload.shareType !== "url") continue;
    const value = (payload.value ?? "").trim();
    if (!value) continue;
    const found = url ? null : URL_PATTERN.exec(value);
    if (found) {
      const candidate = normalizeScheme(found[0].replace(URL_TAIL, ""));
      if (candidate.length <= MAX_URL) url = candidate;
      texts.push(value.replace(found[0], " "));
    } else {
      texts.push(value);
    }
  }
  const name = texts.join(" ").replace(/\s+/g, " ").replace(EDGES, "").trim().slice(0, MAX_NAME);
  if (!url && !name) return null;
  return { url, name };
}
