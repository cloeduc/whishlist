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

export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  return h.get("x-real-ip")?.trim() || "unknown";
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
