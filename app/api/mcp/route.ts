import { createMcpHandler } from "@modelcontextprotocol/server";
import type { NextRequest } from "next/server";
import { origin } from "@/src/auth/current";
import { apiError, apiLocaleFrom, MAX_BODY_BYTES } from "@/src/server/api/http";
import type { CommandContext } from "@/src/server/commands/context";
import { mcpAccess } from "@/src/server/mcp/gate";
import { buildMcpServer } from "@/src/server/mcp/server";
import { clientIp } from "@/src/server/rate-limit";

export const runtime = "nodejs";

/**
 * MCP server (Streamable HTTP, stateless) for an AI assistant. An API key (`Authorization: Bearer oys_…`)
 * is required; an app session token is not enough. A page from another site cannot call it.
 * Message language: `Accept-Language` (English if asked for), otherwise French, like the API.
 */
async function serve(req: NextRequest): Promise<Response> {
  const locale = apiLocaleFrom(req.headers.get("accept-language"));
  const site = await origin();
  const ip = await clientIp();
  const access = await mcpAccess({
    origin: req.headers.get("origin"),
    siteOrigin: site,
    authorization: req.headers.get("authorization"),
    ip,
  });
  if (!access.ok) {
    const refused = await apiError(access.error, locale);
    if (access.error === "unauthorized") refused.headers.set("www-authenticate", 'Bearer realm="mcp"');
    return refused;
  }
  const ctx: CommandContext = { user: access.user, ip, locale, origin: site };
  // One instance per request, built for the key's account; body size capped like the API.
  const handler = createMcpHandler(() => buildMcpServer(ctx), { maxRequestBodySize: MAX_BODY_BYTES });
  const response = await handler.fetch(req);
  response.headers.set("cache-control", "private, no-store");
  return response;
}

export const GET = serve;
export const POST = serve;
export const DELETE = serve;
