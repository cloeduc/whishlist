import { commandContext } from "@/src/server/api/context";
import { apiError, apiJson, apiPreflight, readJsonBody, text, withApi } from "@/src/server/api/http";
import { requestPasswordReset } from "@/src/server/commands/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Toujours 202 : la réponse ne dit pas si l'e-mail a un compte, et ne contient jamais le lien. */
export const POST = withApi(async (api) => {
  const body = await readJsonBody(api.req);
  if (!body.ok) return apiError(body.error, api.locale, api.cors);
  await requestPasswordReset(await commandContext(api), { email: text(body.body.email) });
  return apiJson({ status: "accepted" }, 202, api.cors);
});

export const OPTIONS = apiPreflight;
