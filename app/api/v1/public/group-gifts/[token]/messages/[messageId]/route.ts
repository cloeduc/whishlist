import { commandContext } from "@/src/server/api/context";
import { apiError, apiNoContent, apiPreflight, withApi } from "@/src/server/api/http";
import { deleteMessage } from "@/src/server/commands/group-gift";

export const runtime = "nodejs";

/** Its author removes a message from the thread. */
export const DELETE = withApi<{ token: string; messageId: string }>(async (api, { token, messageId }) => {
  const result = await deleteMessage(await commandContext(api), { token, messageId });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiNoContent(api.cors);
});

export const OPTIONS = apiPreflight;
