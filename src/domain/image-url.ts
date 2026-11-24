import { safeHttpGet, type DnsLookup } from "./safe-http";

function normalized(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

/** Same web address, ignoring the fragment and a trailing slash. */
export function sameAddress(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const left = normalized(a);
  return left !== null && left === normalized(b);
}

/**
 * What an address serves: `notImage` only when the server says so (another content type, or gone);
 * `unknown` when it cannot be told (network, robots refused, server error), so the image is kept.
 */
export type ImageProbe = "image" | "notImage" | "unknown";

export async function probeImage(
  imageUrl: string,
  options: { timeoutMs?: number; lookup?: DnsLookup; fetchImpl?: typeof fetch } = {},
): Promise<ImageProbe> {
  const result = await safeHttpGet(imageUrl, { timeoutMs: options.timeoutMs ?? 8_000, ...options });
  if (!result) return "unknown";
  const { response } = result;
  await response.body?.cancel().catch(() => undefined);
  if (response.status === 404 || response.status === 410) return "notImage";
  if (!response.ok) return "unknown";
  const type = (response.headers.get("content-type") ?? "").trim().toLowerCase();
  if (!type) return "unknown";
  return type.startsWith("image/") ? "image" : "notImage";
}
