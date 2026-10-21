import { headers } from "next/headers";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** In-memory (1 process). Suffisant pour l'instance Docker unique. */
export function takeToken(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

/** IP posée par le proxy (Cloudflare ou X-Real-IP). `X-Forwarded-For` client n’est pas utilisé. */
export function clientAddress(header: {
  cfConnectingIp?: string | null;
  realIp?: string | null;
}): string {
  const cf = header.cfConnectingIp?.split(",")[0]?.trim();
  if (cf) return cf;
  const real = header.realIp?.split(",")[0]?.trim();
  if (real) return real;
  return "unknown";
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return clientAddress({
    cfConnectingIp: h.get("cf-connecting-ip"),
    realIp: h.get("x-real-ip"),
  });
}

export async function rateLimitOrThrow(
  scope: string,
  limit: number,
  windowMs: number,
): Promise<void> {
  const ip = await clientIp();
  if (!takeToken(`${scope}:${ip}`, limit, windowMs)) {
    throw new RateLimitError(scope);
  }
}

export class RateLimitError extends Error {
  readonly scope: string;
  constructor(scope: string) {
    super("rateLimited");
    this.scope = scope;
  }
}

export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError;
}

/** Test helper — vide les buckets. */
export function resetRateLimitsForTests(): void {
  buckets.clear();
}
