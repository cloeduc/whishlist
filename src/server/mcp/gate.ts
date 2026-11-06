import "server-only";
import { isApiKeyToken } from "../../auth/api-keys";
import type { User } from "../../domain/types";
import { apiKeyUser, bearerFrom } from "../api/auth";
import { originDecision } from "../api/http";
import { isRateLimitError } from "../rate-limit";

export type McpAccess =
  | { ok: true; user: User }
  | { ok: false; error: "originNotAllowed" | "unauthorized" | "rateLimited" };

/**
 * Who can open the MCP server: a valid API key (`Bearer oys_…`), never an app session token,
 * and not from another site's page (same origin rule as the API, with no declared origin).
 */
export async function mcpAccess(input: {
  origin: string | null;
  siteOrigin: string;
  authorization: string | null;
  /** Trusted client IP: unknown or revoked keys count failures against it (`apiKeyUser`). */
  ip?: string | null;
}): Promise<McpAccess> {
  if (originDecision({ origin: input.origin, siteOrigin: input.siteOrigin, allowed: [] }) === "deny") {
    return { ok: false, error: "originNotAllowed" };
  }
  const token = bearerFrom(input.authorization);
  if (!token || !isApiKeyToken(token)) return { ok: false, error: "unauthorized" };
  try {
    const user = await apiKeyUser(token, input.ip ?? null);
    return user ? { ok: true, user } : { ok: false, error: "unauthorized" };
  } catch (error) {
    if (isRateLimitError(error)) return { ok: false, error: "rateLimited" };
    throw error;
  }
}
