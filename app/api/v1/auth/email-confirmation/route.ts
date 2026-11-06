import { commandContext } from "@/src/server/api/context";
import { apiError, apiJson, apiPreflight, readJsonBody, text, withApi } from "@/src/server/api/http";
import { confirmEmailWithToken } from "@/src/server/commands/email";

export const runtime = "nodejs";

/**
 * Confirms the link received by email, opened in the app (011). The optional bearer only serves `ownAccount`:
 * the link's token carries all the authorization. The body is not logged (it contains the token).
 */
export const POST = withApi(async (api) => {
  const body = await readJsonBody(api.req);
  if (!body.ok) return apiError(body.error, api.locale, api.cors);
  const result = await confirmEmailWithToken(await commandContext(api), {
    token: text(body.body.token),
    suite: text(body.body.suite) || null,
  });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiJson({ purpose: result.purpose, ownAccount: result.ownAccount, suite: result.suite }, 200, api.cors);
});

export const OPTIONS = apiPreflight;
