import { NextRequest, NextResponse } from "next/server";
import {
  ANALYTICS_PATHS,
  analyticsConfig,
  analyticsUpstreamHeaders,
  prepareAnalyticsEvent,
} from "@/src/server/analytics";
import { siteOrigin } from "@/src/site/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY = 8 * 1024;

function fail(status: number) {
  return new NextResponse(null, {
    status,
    headers: { "cache-control": "private, no-store" },
  });
}

async function proxy(req: NextRequest, path: string[]) {
  const joined = path.join("/");
  if (!ANALYTICS_PATHS.has(joined)) return fail(404);
  if (req.method === "POST" && joined !== "api/send") return fail(405);
  if (req.method !== "GET" && req.method !== "POST") return fail(405);

  const config = analyticsConfig();
  if (!config) return fail(404);

  if (req.method === "POST") {
    const type = req.headers.get("content-type") ?? "";
    if (!type.toLowerCase().startsWith("application/json")) return fail(415);
  }

  const headers = analyticsUpstreamHeaders(req.headers, config.websiteId);
  const dest = `${config.upstream}/${joined}`;
  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
    signal: AbortSignal.timeout(8_000),
  };
  if (req.method === "POST") {
    const body = await req.arrayBuffer();
    if (body.byteLength > MAX_BODY) return fail(413);
    const prepared = prepareAnalyticsEvent(
      new TextDecoder().decode(body),
      config.websiteId,
      new URL(siteOrigin()).hostname,
    );
    if (prepared === "drop") return new NextResponse(null, { status: 204 });
    if (prepared === "invalid") return fail(400);
    headers.set("content-type", "application/json");
    init.body = prepared;
  }

  let upstream: Response;
  try {
    upstream = await fetch(dest, init);
  } catch {
    return fail(502);
  }

  if (joined === "script.js") {
    const type = upstream.headers.get("content-type") ?? "";
    if (!/javascript/i.test(type)) return fail(502);
  }

  const out = new Headers();
  for (const name of ["content-type", "cache-control", "etag"]) {
    const value = upstream.headers.get(name);
    if (value) out.set(name, value);
  }
  if (upstream.status >= 400 || joined !== "script.js") {
    out.set("cache-control", "private, no-store");
  }
  return new NextResponse(upstream.body, { status: upstream.status, headers: out });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
