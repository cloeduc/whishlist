import { guestProofsForList } from "@/src/server/api/auth";
import { commandContext } from "@/src/server/api/context";
import { apiError, apiJson, apiPreflight, readJsonBody, withApi } from "@/src/server/api/http";
import { toGroupGiftView } from "@/src/server/api/views";
import { readGroupGift, setStatus } from "@/src/server/commands/group-gift";

export const runtime = "nodejs";

/** « Le cadeau est complet » / « Rouvrir le cadeau » (participant). */
export const PUT = withApi<{ token: string }>(async (api, { token }) => {
  const body = await readJsonBody(api.req);
  if (!body.ok) return apiError(body.error, api.locale, api.cors);
  const status = body.body.status;
  if (status !== "open" && status !== "complete") return apiError("invalidStatus", api.locale, api.cors);
  const ctx = await commandContext(api);
  const proofs = guestProofsForList(api.req);
  const result = await setStatus(ctx, { token, status, ...proofs });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  const gift = await readGroupGift(ctx, { token, ...proofs });
  if (!gift.ok) return apiError(gift.error, api.locale, api.cors);
  return apiJson(toGroupGiftView(gift.gift, gift.wishlist), 200, api.cors);
});

export const OPTIONS = apiPreflight;
