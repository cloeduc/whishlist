import { commandContext } from "@/src/server/api/context";
import { apiError, apiNoContent, apiPreflight, withApi } from "@/src/server/api/http";
import { leave } from "@/src/server/commands/sharing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApi<{ listId: string }>(async (api, { listId }) => {
  const result = await leave(await commandContext(api), { wishlistId: listId });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiNoContent(api.cors);
});

export const OPTIONS = apiPreflight;
