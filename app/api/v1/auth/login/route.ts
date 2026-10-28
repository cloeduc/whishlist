import { commandContext } from "@/src/server/api/context";
import { apiError, apiJson, apiPreflight, readJsonBody, text, withApi } from "@/src/server/api/http";
import { login } from "@/src/server/commands/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApi(async (api) => {
  const body = await readJsonBody(api.req);
  if (!body.ok) return apiError(body.error, api.locale, api.cors);
  const result = await login(await commandContext(api), {
    email: text(body.body.email),
    password: text(body.body.password),
  });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiJson(result.session, 200, api.cors);
});

export const OPTIONS = apiPreflight;
