import { commandContext } from "@/src/server/api/context";
import { apiError, apiJson, apiNoContent, apiPreflight, readJsonBody, withApi } from "@/src/server/api/http";
import { itemFieldsFrom } from "@/src/server/api/item-body";
import { toMemberItem } from "@/src/server/api/views";
import { deleteItem, patchItem, saveItem } from "@/src/server/commands/items";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { listId: string; itemId: string };

export const PUT = withApi<Params>(async (api, { listId, itemId }) => {
  const body = await readJsonBody(api.req);
  if (!body.ok) return apiError(body.error, api.locale, api.cors);
  const result = await saveItem(await commandContext(api), itemFieldsFrom(listId, body.body, itemId));
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiJson(toMemberItem(result.item, api.locale), 200, api.cors);
});

/** `{ archived?, typeId? }` : au moins un des deux, appliqués ensemble ou pas du tout. */
export const PATCH = withApi<Params>(async (api, { listId, itemId }) => {
  const body = await readJsonBody(api.req);
  if (!body.ok) return apiError(body.error, api.locale, api.cors);
  const { archived, typeId } = body.body;
  if (typeof archived !== "boolean" && typeof typeId !== "string") {
    return apiError("invalidJson", api.locale, api.cors);
  }
  const result = await patchItem(await commandContext(api), {
    wishlistId: listId,
    itemId,
    typeId: typeof typeId === "string" ? typeId : undefined,
    archived: typeof archived === "boolean" ? archived : undefined,
  });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiJson(toMemberItem(result.item, api.locale), 200, api.cors);
});

export const DELETE = withApi<Params>(async (api, { listId, itemId }) => {
  const result = await deleteItem(await commandContext(api), { wishlistId: listId, itemId });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiNoContent(api.cors);
});

export const OPTIONS = apiPreflight;
