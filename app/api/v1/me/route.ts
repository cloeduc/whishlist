import { commandContext } from "@/src/server/api/context";
import { apiError, apiJson, apiPreflight, readJsonBody, text, withApi } from "@/src/server/api/http";
import { updateOwnDisplayName } from "@/src/server/commands/auth";
import { toMe } from "@/src/server/api/views";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Répond aussi quand le mot de passe doit être changé : le client l'apprend ici. */
export const GET = withApi(async (api) => {
  const { user } = await commandContext(api);
  if (!user) return apiError("unauthorized", api.locale, api.cors);
  return apiJson(toMe(user), 200, api.cors);
});

export const PATCH = withApi(async (api) => {
  const body = await readJsonBody(api.req);
  if (!body.ok) return apiError(body.error, api.locale, api.cors);
  const result = await updateOwnDisplayName(await commandContext(api), { displayName: text(body.body.displayName) });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiJson(toMe(result.user), 200, api.cors);
});

export const OPTIONS = apiPreflight;
