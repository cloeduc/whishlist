import { guestProofs } from "@/src/server/api/auth";
import { commandContext } from "@/src/server/api/context";
import { apiError, apiJson, apiPreflight, withApi } from "@/src/server/api/http";
import { readPublicList } from "@/src/server/commands/public-list";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApi<{ readToken: string }>(async (api, { readToken }) => {
  const result = await readPublicList(await commandContext(api), { readToken, ...guestProofs(api.req, readToken) });
  if (!result.ok) {
    const extra = "title" in result ? { title: result.title } : undefined;
    return apiError(result.error, api.locale, api.cors, extra);
  }
  return apiJson(result.list, 200, api.cors);
});

export const OPTIONS = apiPreflight;
