import { commandContext } from "@/src/server/api/context";
import { apiError, apiJson, apiNoContent, apiPreflight, readJsonBody, withApi } from "@/src/server/api/http";
import { renameFollowedList, unsubscribeFromList } from "@/src/server/commands/public-list";

export const runtime = "nodejs";

/** A name field: a string, otherwise null (back to the list's own value). */
function nameOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export const PUT = withApi<{ readToken: string }>(async (api, { readToken }) => {
  const body = await readJsonBody(api.req);
  if (!body.ok) return apiError(body.error, api.locale, api.cors);
  const result = await renameFollowedList(await commandContext(api), {
    readToken,
    customTitle: nameOrNull(body.body.customTitle),
    customOwnerName: nameOrNull(body.body.customOwnerName),
  });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiJson(result.subscription, 200, api.cors);
});

export const DELETE = withApi<{ readToken: string }>(async (api, { readToken }) => {
  const result = await unsubscribeFromList(await commandContext(api), { readToken });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiNoContent(api.cors);
});

export const OPTIONS = apiPreflight;
