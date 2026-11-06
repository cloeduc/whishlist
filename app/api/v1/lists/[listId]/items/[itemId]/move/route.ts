import { commandContext } from "@/src/server/api/context";
import { apiError, apiJson, apiPreflight, readJsonBody, text, withApi } from "@/src/server/api/http";
import { toMemberItem } from "@/src/server/api/views";
import { moveItem } from "@/src/server/commands/items";

export const runtime = "nodejs";

/** `{ targetListId, typeId, personId }`: the idea changes list and keeps its id. */
export const POST = withApi<{ listId: string; itemId: string }>(async (api, { listId, itemId }) => {
  const body = await readJsonBody(api.req);
  if (!body.ok) return apiError(body.error, api.locale, api.cors);
  const result = await moveItem(await commandContext(api), {
    wishlistId: listId,
    itemId,
    targetWishlistId: text(body.body.targetListId),
    typeId: text(body.body.typeId),
    personId: text(body.body.personId),
  });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiJson(toMemberItem(result.item, api.locale), 200, api.cors);
});

export const OPTIONS = apiPreflight;
