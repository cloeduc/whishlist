import { commandContext } from "@/src/server/api/context";
import { apiError, apiJson, apiPreflight, withApi } from "@/src/server/api/http";
import { regenerateInvite } from "@/src/server/commands/sharing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApi<{ listId: string }>(async (api, { listId }) => {
  const result = await regenerateInvite(await commandContext(api), { wishlistId: listId });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiJson({ inviteUrl: result.inviteUrl, inviteToken: result.inviteToken }, 200, api.cors);
});

export const OPTIONS = apiPreflight;
