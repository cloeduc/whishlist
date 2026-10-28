import { commandContext } from "@/src/server/api/context";
import { apiError, apiJson, apiPreflight, withApi } from "@/src/server/api/http";
import { joinInvite } from "@/src/server/commands/sharing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApi<{ inviteToken: string }>(async (api, { inviteToken }) => {
  const result = await joinInvite(await commandContext(api), { token: inviteToken });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiJson(result.list, 200, api.cors);
});

export const OPTIONS = apiPreflight;
