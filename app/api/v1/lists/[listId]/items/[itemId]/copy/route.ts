import { commandContext } from "@/src/server/api/context";
import { apiError, apiJson, apiPreflight, optionalText, readJsonBody, text, withApi } from "@/src/server/api/http";
import { toMemberItem } from "@/src/server/api/views";
import { copyItem } from "@/src/server/commands/items";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** `{ targetListId, typeId, personId, id? }`: copy of the idea, without its reservation. */
export const POST = withApi<{ listId: string; itemId: string }>(async (api, { listId, itemId }) => {
  const body = await readJsonBody(api.req);
  if (!body.ok) return apiError(body.error, api.locale, api.cors);
  const result = await copyItem(await commandContext(api), {
    wishlistId: listId,
    itemId,
    targetWishlistId: text(body.body.targetListId),
    typeId: text(body.body.typeId),
    personId: text(body.body.personId),
    clientId: optionalText(body.body.id),
  });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  // 200: replay of a copy already received (same `id`).
  return apiJson(toMemberItem(result.item, api.locale), result.replayed ? 200 : 201, api.cors);
});

export const OPTIONS = apiPreflight;
