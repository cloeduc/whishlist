import { commandContext } from "@/src/server/api/context";
import { apiError, apiNoContent, apiPreflight, withApi } from "@/src/server/api/http";
import { cancelGroupGiftAsMember } from "@/src/server/commands/items";

export const runtime = "nodejs";

export const DELETE = withApi<{ listId: string; groupGiftId: string }>(async (api, { listId, groupGiftId }) => {
  const result = await cancelGroupGiftAsMember(await commandContext(api), { wishlistId: listId, groupGiftId });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiNoContent(api.cors);
});

export const OPTIONS = apiPreflight;
