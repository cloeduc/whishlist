import { commandContext } from "@/src/server/api/context";
import { apiError, apiJson, apiPreflight, readJsonBody, text, withApi } from "@/src/server/api/http";
import { unlockPublicList } from "@/src/server/commands/public-list";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApi<{ readToken: string }>(async (api, { readToken }) => {
  const body = await readJsonBody(api.req);
  if (!body.ok) return apiError(body.error, api.locale, api.cors);
  const result = await unlockPublicList(await commandContext(api), { readToken, password: text(body.body.password) });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiJson({ unlockToken: result.unlockToken, expiresAt: result.expiresAt }, 200, api.cors);
});

export const OPTIONS = apiPreflight;
