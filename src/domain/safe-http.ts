import { lookup as dnsLookup } from "node:dns/promises";
import type { LookupAddress } from "node:dns";

const MAX_REDIRECTS = 5;
const ALLOWED_PORTS = new Set(["", "80", "443"]);

const BROWSER_HEADERS = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
} as const;

export type DnsLookup = (
  hostname: string,
  options: { all: true },
) => Promise<LookupAddress[]>;

/** IPv4 / IPv6 privés, loopback, link-local, CGNAT, documentation — SSRF. */
export function isBlockedIp(ip: string): boolean {
  const normalized = ip.trim().toLowerCase();
  if (!normalized) return true;

  if (normalized.includes(":")) {
    return isBlockedIpv6(normalized);
  }
  return isBlockedIpv4(normalized);
}

function isBlockedIpv4(ip: string): boolean {
  const parts = ip.split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local / cloud metadata
  if (a === 172 && b !== undefined && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b !== undefined && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 192 && b === 0 && parts[2] === 0) return true; // IETF protocol
  if (a === 192 && b === 0 && parts[2] === 2) return true; // TEST-NET-1
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a === 198 && b === 51 && parts[2] === 100) return true; // TEST-NET-2
  if (a === 203 && b === 0 && parts[2] === 113) return true; // TEST-NET-3
  if (a !== undefined && a >= 224) return true; // multicast / reserved
  return false;
}

function isBlockedIpv6(ip: string): boolean {
  // IPv4-mapped ::ffff:a.b.c.d
  const mapped = ip.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mapped?.[1]) return isBlockedIpv4(mapped[1]);

  const compact = ip.replace(/^\[|\]$/g, "");
  if (compact === "::1" || compact === "::") return true;

  // Expand enough to check prefixes (lowercase hex without zone id)
  const bare = compact.split("%")[0]!;
  if (bare.startsWith("fe80:") || bare.startsWith("feb")) return true; // link-local fe80::/10
  if (bare.startsWith("fc") || bare.startsWith("fd")) return true; // ULA fc00::/7
  if (bare.startsWith("ff")) return true; // multicast

  // ::ffff:0:a.b.c.d variant already handled; also hex form ::ffff:7f00:1
  const hexMapped = bare.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
  if (hexMapped) {
    const hi = parseInt(hexMapped[1]!, 16);
    const lo = parseInt(hexMapped[2]!, 16);
    const a = (hi >> 8) & 255;
    const b = hi & 255;
    const c = (lo >> 8) & 255;
    const d = lo & 255;
    return isBlockedIpv4(`${a}.${b}.${c}.${d}`);
  }
  return false;
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.$/, "");
  if (!host) return true;
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host.endsWith(".local") || host.endsWith(".internal")) return true;
  if (host === "metadata.google.internal") return true;
  if (host === "metadata" || host.endsWith(".metadata")) return true;
  // Literal IP as hostname
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) && isBlockedIpv4(host)) return true;
  if (host.includes(":") && isBlockedIpv6(host)) return true;
  return false;
}

/**
 * Vérifie schéma/port/host + résolution DNS publique.
 * À rappeler sur chaque hop de redirect (anti DNS rebinding / bounce privé).
 */
export async function assertSafeFetchUrl(
  raw: string,
  lookup: DnsLookup = (hostname, options) => dnsLookup(hostname, options),
): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("urlInvalid");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("urlInvalid");
  }
  if (url.username || url.password) throw new Error("urlInvalid");
  if (!ALLOWED_PORTS.has(url.port)) throw new Error("urlPortBlocked");
  if (isBlockedHostname(url.hostname)) throw new Error("urlHostBlocked");

  // Hostname is an IP literal
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(url.hostname) || url.hostname.includes(":")) {
    if (isBlockedIp(url.hostname.replace(/^\[|\]$/g, ""))) throw new Error("urlHostBlocked");
    return url;
  }

  const records = await lookup(url.hostname, { all: true });
  if (!records.length) throw new Error("urlHostBlocked");
  for (const record of records) {
    if (isBlockedIp(record.address)) throw new Error("urlHostBlocked");
  }
  return url;
}

export async function safeHttpGet(
  pageUrl: string,
  options: {
    timeoutMs?: number;
    lookup?: DnsLookup;
    fetchImpl?: typeof fetch;
  } = {},
): Promise<{ response: Response; finalUrl: string } | null> {
  const timeoutMs = options.timeoutMs ?? 10_000;
  const lookup = options.lookup ?? ((hostname, opts) => dnsLookup(hostname, opts));
  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let current = await assertSafeFetchUrl(pageUrl, lookup);
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const response = await fetchImpl(current.toString(), {
        signal: controller.signal,
        redirect: "manual",
        headers: BROWSER_HEADERS,
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) return null;
        const next = new URL(location, current);
        current = await assertSafeFetchUrl(next.toString(), lookup);
        continue;
      }

      return { response, finalUrl: current.toString() };
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
