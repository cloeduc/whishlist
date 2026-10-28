import { commandContext } from "@/src/server/api/context";
import { apiError, apiJson, apiPreflight, readJsonBody, withApi } from "@/src/server/api/http";
import { itemFieldsFrom } from "@/src/server/api/item-body";
import { toMemberItem } from "@/src/server/api/views";
import { saveItem } from "@/src/server/commands/items";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApi<{ listId: string }>(async (api, { listId }) => {
  const body = await readJsonBody(api.req);
  if (!body.ok) return apiError(body.error, api.locale, api.cors);
  const result = await saveItem(await commandContext(api), itemFieldsFrom(listId, body.body));
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiJson(toMemberItem(result.item, api.locale), 201, api.cors);
});

export const OPTIONS = apiPreflight;
