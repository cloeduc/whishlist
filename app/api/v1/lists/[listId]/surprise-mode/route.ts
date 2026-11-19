import { commandContext } from "@/src/server/api/context";
import { apiError, apiJson, apiPreflight, readJsonBody, withApi } from "@/src/server/api/http";
import { setSurpriseMode } from "@/src/server/commands/lists";

export const runtime = "nodejs";

/** « Ne pas voir les cadeaux réservés » for the signed-in member (020). */
export const PUT = withApi<{ listId: string }>(async (api, { listId }) => {
  const body = await readJsonBody(api.req);
  if (!body.ok) return apiError(body.error, api.locale, api.cors);
  const result = await setSurpriseMode(await commandContext(api), { wishlistId: listId, enabled: body.body.enabled });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiJson(result.list, 200, api.cors);
});

export const OPTIONS = apiPreflight;
