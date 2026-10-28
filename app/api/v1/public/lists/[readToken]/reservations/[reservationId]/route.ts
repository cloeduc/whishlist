import { guestProofs } from "@/src/server/api/auth";
import { commandContext } from "@/src/server/api/context";
import { apiError, apiNoContent, apiPreflight, withApi } from "@/src/server/api/http";
import { cancelOwn } from "@/src/server/commands/public-list";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const DELETE = withApi<{ readToken: string; reservationId: string }>(async (api, { readToken, reservationId }) => {
  const { claimedIds } = guestProofs(api.req, readToken);
  const result = await cancelOwn(await commandContext(api), { readToken, reservationId, claimedIds });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiNoContent(api.cors);
});

export const OPTIONS = apiPreflight;
