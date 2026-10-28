import { commandContext } from "@/src/server/api/context";
import { apiError, apiJson, apiPreflight, readJsonBody, text, withApi } from "@/src/server/api/http";
import { openApiSession, register } from "@/src/server/commands/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApi(async (api) => {
  const body = await readJsonBody(api.req);
  if (!body.ok) return apiError(body.error, api.locale, api.cors);
  const result = await register(await commandContext(api), {
    email: text(body.body.email),
    password: text(body.body.password),
    displayName: text(body.body.displayName),
  });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  // E-mail déjà inscrit : un e-mail part, pas de connexion.
  if (!result.user) return apiJson({ status: "checkEmail" }, 202, api.cors);
  const session = await openApiSession(result.user.id);
  if (!session.ok) return apiError(session.error, api.locale, api.cors);
  return apiJson(session.session, 201, api.cors);
});

export const OPTIONS = apiPreflight;
