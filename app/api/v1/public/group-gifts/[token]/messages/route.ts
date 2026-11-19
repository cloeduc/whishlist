import { guestProofsForList } from "@/src/server/api/auth";
import { commandContext } from "@/src/server/api/context";
import { apiError, apiJson, apiPreflight, readJsonBody, text, withApi } from "@/src/server/api/http";
import { postMessage } from "@/src/server/commands/group-gift";

export const runtime = "nodejs";

/** A message in the participants' thread (028, US5): a participant with an account. */
export const POST = withApi<{ token: string }>(async (api, { token }) => {
  const body = await readJsonBody(api.req);
  if (!body.ok) return apiError(body.error, api.locale, api.cors);
  const result = await postMessage(await commandContext(api), { token, body: text(body.body.body), isUnlocked: guestProofsForList(api.req).isUnlocked });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  const { message } = result;
  return apiJson(
    { id: message.id, authorName: message.authorName, body: message.body, createdAt: message.createdAt, mine: true },
    201,
    api.cors,
  );
});

export const OPTIONS = apiPreflight;
