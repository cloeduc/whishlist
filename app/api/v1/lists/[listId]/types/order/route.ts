import { commandContext } from "@/src/server/api/context";
import { apiError, apiNoContent, apiPreflight, readJsonBody, withApi } from "@/src/server/api/http";
import { reorderTypes } from "@/src/server/commands/labels";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PUT = withApi<{ listId: string }>(async (api, { listId }) => {
  const body = await readJsonBody(api.req);
  if (!body.ok) return apiError(body.error, api.locale, api.cors);
  const typeIds = body.body.typeIds;
  if (!Array.isArray(typeIds) || !typeIds.every((id) => typeof id === "string")) {
    return apiError("invalidJson", api.locale, api.cors);
  }
  const result = await reorderTypes(await commandContext(api), { wishlistId: listId, orderedTypeIds: typeIds });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiNoContent(api.cors);
});

export const OPTIONS = apiPreflight;
