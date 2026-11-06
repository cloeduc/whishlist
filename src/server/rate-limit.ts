import "server-only";
import { headers } from "next/headers";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** In-memory (1 process). Enough for the single Docker instance. */
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

/** True if the bucket has already taken `limit` tokens in its current window, without taking one. */
export function bucketExhausted(key: string, limit: number, now = Date.now()): boolean {
  const current = buckets.get(key);
  return current !== undefined && current.resetAt > now && current.count >= limit;
}

function trustedIp(value: string | null | undefined): string | null {
  const hop = value?.split(",")[0]?.trim() ?? "";
  if (!hop || hop.length > 64) return null;
  if (!/^[0-9a-fA-F:.]+$/.test(hop)) return null;
  return hop;
}

/**
 * IP set by the proxy (Cloudflare, then X-Real-IP).
 * `X-Forwarded-For` is not read: the client can make it up.
 * `null` if there is no trusted IP — never a shared « unknown » bucket.
 */
export function clientAddress(header: {
  cfConnectingIp?: string | null;
  realIp?: string | null;
}): string | null {
  return trustedIp(header.cfConnectingIp) ?? trustedIp(header.realIp);
}

/** Without a trusted IP: refused in production, not limited in dev. */
export function missingIpPolicy(nodeEnv = process.env.NODE_ENV): "skip" | "deny" {
  return nodeEnv === "production" ? "deny" : "skip";
}

export async function clientIp(): Promise<string | null> {
  const h = await headers();
  return clientAddress({
    cfConnectingIp: h.get("cf-connecting-ip"),
    realIp: h.get("x-real-ip"),
  });
}

/** Same rule as `rateLimitOrThrow`, with an IP already read (commands shared by site / API). */
export function rateLimitForIp(
  scope: string,
  ip: string | null,
  limit: number,
  windowMs: number,
): void {
  if (!ip) {
    if (missingIpPolicy() === "deny") throw new RateLimitError(scope);
    return;
  }
  if (!takeToken(`${scope}:${ip}`, limit, windowMs)) {
    throw new RateLimitError(scope);
  }
}

export async function rateLimitOrThrow(
  scope: string,
  limit: number,
  windowMs: number,
): Promise<void> {
  rateLimitForIp(scope, await clientIp(), limit, windowMs);
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

/** Test helper — clears the buckets. */
export function resetRateLimitsForTests(): void {
  buckets.clear();
}
