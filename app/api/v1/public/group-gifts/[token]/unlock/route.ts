import { commandContext } from "@/src/server/api/context";
import { apiError, apiJson, apiPreflight, readJsonBody, text, withApi } from "@/src/server/api/http";
import { unlockGroupGift } from "@/src/server/commands/group-gift";

export const runtime = "nodejs";

export const POST = withApi<{ token: string }>(async (api, { token }) => {
  const body = await readJsonBody(api.req);
  if (!body.ok) return apiError(body.error, api.locale, api.cors);
  const result = await unlockGroupGift(await commandContext(api), { token, password: text(body.body.password) });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiJson({ unlockToken: result.unlockToken, expiresAt: result.expiresAt }, 200, api.cors);
});

export const OPTIONS = apiPreflight;
