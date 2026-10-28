import { commandContext } from "@/src/server/api/context";
import { apiError, apiJson, apiPreflight, readJsonBody, text, withApi } from "@/src/server/api/http";
import { sendInvite } from "@/src/server/commands/sharing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApi<{ listId: string }>(async (api, { listId }) => {
  const body = await readJsonBody(api.req);
  if (!body.ok) return apiError(body.error, api.locale, api.cors);
  const result = await sendInvite(await commandContext(api), { wishlistId: listId, email: text(body.body.email) });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiJson({ status: "sent" }, 202, api.cors);
});

export const OPTIONS = apiPreflight;
