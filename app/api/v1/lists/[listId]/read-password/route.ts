import { commandContext } from "@/src/server/api/context";
import { apiError, apiNoContent, apiPreflight, readJsonBody, text, withApi } from "@/src/server/api/http";
import { clearReadPassword, setReadPassword } from "@/src/server/commands/sharing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PUT = withApi<{ listId: string }>(async (api, { listId }) => {
  const body = await readJsonBody(api.req);
  if (!body.ok) return apiError(body.error, api.locale, api.cors);
  const result = await setReadPassword(await commandContext(api), { wishlistId: listId, password: text(body.body.password) });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiNoContent(api.cors);
});

export const DELETE = withApi<{ listId: string }>(async (api, { listId }) => {
  const result = await clearReadPassword(await commandContext(api), { wishlistId: listId });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiNoContent(api.cors);
});

export const OPTIONS = apiPreflight;
