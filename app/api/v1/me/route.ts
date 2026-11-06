import { commandContext } from "@/src/server/api/context";
import { apiError, apiJson, apiPreflight, readJsonBody, text, withApi } from "@/src/server/api/http";
import { readMe, updateOwnDisplayName } from "@/src/server/commands/auth";

export const runtime = "nodejs";

/** Also answers when the password must be changed: the client learns it here. */
export const GET = withApi(async (api) => {
  const result = await readMe(await commandContext(api));
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiJson(result.me, 200, api.cors);
});

export const PATCH = withApi(async (api) => {
  const body = await readJsonBody(api.req);
  if (!body.ok) return apiError(body.error, api.locale, api.cors);
  const result = await updateOwnDisplayName(await commandContext(api), { displayName: text(body.body.displayName) });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiJson(result.me, 200, api.cors);
});

export const OPTIONS = apiPreflight;
