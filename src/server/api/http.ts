import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, type Locale } from "../../i18n/config";
import { translateErrorFor } from "../../i18n/server";
import { origin as siteOrigin } from "../../auth/current";
import { normalizeAppOrigin } from "../../auth/origin";
import { clientIp, isRateLimitError } from "../rate-limit";
import { apiStatusFor, publicErrorCode } from "./errors";
import { usesApiKey } from "./auth";

/** Maximum size of a request body (API and MCP server). */
export const MAX_BODY_BYTES = 64 * 1024;

const ALLOWED_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
const ALLOWED_HEADERS = "Authorization, Content-Type, Accept-Language, X-Read-Unlock, X-Reservation-Claims";

export type OriginDecision = "allow" | "allow-cors" | "deny";

/** Web origin to return in `Access-Control-Allow-Origin`, or null. */
type Cors = string | null;

export type ApiRequestContext = {
  req: NextRequest;
  locale: Locale;
  ip: string | null;
  cors: Cors;
};

/** Schemes accepted for an app origin: the web, and Capacitor / Ionic WebViews. */
const APP_PROTOCOLS = ["http:", "https:", "capacitor:", "ionic:"];

export function parseAllowedOrigins(raw: string | undefined = process.env.API_ALLOWED_ORIGINS): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => normalizeAppOrigin(entry, APP_PROTOCOLS))
    .filter((origin): origin is string => origin !== null);
}

/**
 * Without `Origin` (native app, curl): accepted. From the site: accepted without CORS.
 * From a declared origin: accepted with CORS. Otherwise: refused (FR-040).
 */
export function originDecision(input: {
  origin: string | null;
  siteOrigin: string;
  allowed: readonly string[];
}): OriginDecision {
  if (!input.origin) return "allow";
  if (input.origin === input.siteOrigin) return "allow";
  if (input.allowed.includes(input.origin)) return "allow-cors";
  return "deny";
}

/** Message language: the first requested language if it is English, otherwise French. */
export function apiLocaleFrom(acceptLanguage: string | null): Locale {
  const first = acceptLanguage?.split(",")[0]?.trim().toLowerCase() ?? "";
  return first === "en" || first.startsWith("en-") ? "en" : defaultLocale;
}

function baseHeaders(cors: Cors): Headers {
  const headers = new Headers({ "cache-control": "private, no-store" });
  if (cors) {
    headers.set("access-control-allow-origin", cors);
    headers.set("vary", "Origin");
  }
  return headers;
}

export function apiJson(data: unknown, status = 200, cors: Cors = null): NextResponse {
  return NextResponse.json(data, { status, headers: baseHeaders(cors) });
}

export function apiNoContent(cors: Cors = null): NextResponse {
  return new NextResponse(null, { status: 204, headers: baseHeaders(cors) });
}

export async function apiError(
  code: string,
  locale: Locale,
  cors: Cors = null,
  extra?: Record<string, unknown>,
): Promise<NextResponse> {
  const publicCode = publicErrorCode(code);
  const message = await translateErrorFor(locale, publicCode);
  return apiJson({ error: { code: publicCode, message }, ...extra }, apiStatusFor(publicCode), cors);
}


export type JsonBody = Record<string, unknown>;

/** Reads at most `MAX_BODY_BYTES` bytes, even without `Content-Length` (chunked body). */
async function readLimited(req: Request): Promise<Uint8Array | null> {
  if (!req.body) return new Uint8Array();
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

/** Object JSON body; each field stays `unknown` until the route checks it. */
export async function readJsonBody(
  req: Request,
): Promise<{ ok: true; body: JsonBody } | { ok: false; error: "unsupportedMediaType" | "payloadTooLarge" | "invalidJson" }> {
  const type = req.headers.get("content-type") ?? "";
  if (!type.toLowerCase().startsWith("application/json")) return { ok: false, error: "unsupportedMediaType" };
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY_BYTES) return { ok: false, error: "payloadTooLarge" };
  const raw = await readLimited(req);
  if (!raw) return { ok: false, error: "payloadTooLarge" };
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(raw));
    if (!isJsonObject(parsed)) return { ok: false, error: "invalidJson" };
    return { ok: true, body: parsed };
  } catch {
    return { ok: false, error: "invalidJson" };
  }
}

export function isJsonObject(value: unknown): value is JsonBody {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Text field of a JSON body: a string, otherwise "". */
export function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Optional field: missing → `undefined`; present but not a string → `""` (refused by the command). */
export function optionalText(value: unknown): string | undefined {
  return value === undefined ? undefined : text(value);
}

/** The site origin is the links' origin (`APP_ORIGIN`, otherwise derived from the request like the site). */
async function decide(req: NextRequest): Promise<{ decision: OriginDecision; cors: Cors }> {
  const origin = req.headers.get("origin");
  const decision = originDecision({ origin, siteOrigin: await siteOrigin(), allowed: parseAllowedOrigins() });
  return { decision, cors: decision === "allow-cors" ? origin : null };
}

type HandlerContext<P> = { params: Promise<P> };

/** Common wrapper: origin, language, IP, rate limits and unexpected errors. */
/**
 * API path for the log, without the tokens it carries (invitation, public link of a list):
 * they give access to a list and are never written in plain text in the logs (011, FR-009).
 */
export function redactedApiPath(pathname: string): string {
  return pathname.replace(/\/(invitations|public\/lists)\/[^/]+/g, "/$1/…");
}

export function withApi<P = Record<string, never>>(
  handler: (api: ApiRequestContext, params: P) => Promise<Response>,
): (req: NextRequest, ctx: HandlerContext<P>) => Promise<Response> {
  return async (req, ctx) => {
    const locale = apiLocaleFrom(req.headers.get("accept-language"));
    // An API key only opens the MCP server (`/api/mcp`): the JSON API stays for app session tokens,
    // so that a route added later is never opened to a key by mistake.
    if (usesApiKey(req)) return apiError("apiKeyNotAllowed", locale);
    const { decision, cors } = await decide(req);
    if (decision === "deny") return apiError("originNotAllowed", locale);
    try {
      const params = await ctx.params;
      const api = { req, locale, ip: await clientIp(), cors };
      return await handler(api, params);
    } catch (error) {
      if (isRateLimitError(error)) return apiError("rateLimited", locale, cors);
      console.error("API error", req.method, redactedApiPath(req.nextUrl.pathname), error);
      return apiError("serverError", locale, cors);
    }
  };
}

/** Response to the CORS preflight, for declared origins only. */
export async function apiPreflight(req: NextRequest): Promise<Response> {
  const { decision, cors } = await decide(req);
  if (decision !== "allow-cors" || !cors) {
    return apiError("originNotAllowed", apiLocaleFrom(req.headers.get("accept-language")));
  }
  const headers = baseHeaders(cors);
  headers.set("access-control-allow-methods", ALLOWED_METHODS);
  headers.set("access-control-allow-headers", ALLOWED_HEADERS);
  headers.set("access-control-max-age", "600");
  return new NextResponse(null, { status: 204, headers });
}
