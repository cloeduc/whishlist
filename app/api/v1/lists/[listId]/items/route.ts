import { commandContext } from "@/src/server/api/context";
import { apiError, apiJson, apiPreflight, optionalText, readJsonBody, withApi } from "@/src/server/api/http";
import { itemFieldsFrom } from "@/src/server/api/item-body";
import { toMemberItem } from "@/src/server/api/views";
import { saveItem } from "@/src/server/commands/items";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApi<{ listId: string }>(async (api, { listId }) => {
  const body = await readJsonBody(api.req);
  if (!body.ok) return apiError(body.error, api.locale, api.cors);
  const result = await saveItem(await commandContext(api), {
    ...itemFieldsFrom(listId, body.body),
    clientId: optionalText(body.body.id),
  });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  // 200 : renvoi d'une création déjà reçue (même `id`), l'idée n'est pas modifiée.
  return apiJson(toMemberItem(result.item, api.locale), result.replayed ? 200 : 201, api.cors);
});

export const OPTIONS = apiPreflight;
