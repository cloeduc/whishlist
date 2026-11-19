import { commandContext } from "@/src/server/api/context";
import { apiError, apiJson, apiNoContent, apiPreflight, isTextOrNull, readJsonBody, withApi } from "@/src/server/api/http";
import { renameFollowedList, unsubscribeFromList } from "@/src/server/commands/public-list";

export const runtime = "nodejs";

export const PUT = withApi<{ readToken: string }>(async (api, { readToken }) => {
  const body = await readJsonBody(api.req);
  if (!body.ok) return apiError(body.error, api.locale, api.cors);
  const { customTitle, customOwnerName } = body.body;
  // Each name is a string or null (back to the list's own value); a missing or other value is refused.
  if (!isTextOrNull(customTitle) || !isTextOrNull(customOwnerName)) return apiError("invalidJson", api.locale, api.cors);
  const result = await renameFollowedList(await commandContext(api), { readToken, customTitle, customOwnerName });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiJson(result.subscription, 200, api.cors);
});

export const DELETE = withApi<{ readToken: string }>(async (api, { readToken }) => {
  const result = await unsubscribeFromList(await commandContext(api), { readToken });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiNoContent(api.cors);
});

export const OPTIONS = apiPreflight;
