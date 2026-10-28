import { commandContext } from "@/src/server/api/context";
import { apiError, apiNoContent, apiPreflight, withApi } from "@/src/server/api/http";
import { removeMember } from "@/src/server/commands/sharing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const DELETE = withApi<{ listId: string; userId: string }>(async (api, { listId, userId }) => {
  const result = await removeMember(await commandContext(api), { wishlistId: listId, userId });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiNoContent(api.cors);
});

export const OPTIONS = apiPreflight;
