import { guestProofsForList } from "@/src/server/api/auth";
import { commandContext } from "@/src/server/api/context";
import { apiError, apiJson, apiNoContent, apiPreflight, readJsonBody, withApi } from "@/src/server/api/http";
import { amountField } from "@/src/server/api/group-gift";
import { toGroupGiftView } from "@/src/server/api/views";
import { leaveGroupGift, readGroupGift, setAmount } from "@/src/server/commands/group-gift";

export const runtime = "nodejs";

/** A participant with an account changes or clears their amount (US4). */
export const PATCH = withApi<{ token: string; reservationId: string }>(async (api, { token, reservationId }) => {
  const body = await readJsonBody(api.req);
  if (!body.ok) return apiError(body.error, api.locale, api.cors);
  const amount = amountField(body.body.amountCents);
  if (amount === "invalid") return apiError("invalidAmount", api.locale, api.cors);
  const ctx = await commandContext(api);
  const result = await setAmount(ctx, { token, reservationId, amount });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  const gift = await readGroupGift(ctx, { token, ...guestProofsForList(api.req) });
  if (!gift.ok) return apiError(gift.error, api.locale, api.cors);
  return apiJson(toGroupGiftView(gift.gift, gift.wishlist), 200, api.cors);
});

/** « Retirer ma participation »: account or claim. */
export const DELETE = withApi<{ token: string; reservationId: string }>(async (api, { token, reservationId }) => {
  const { claimsFor } = guestProofsForList(api.req);
  const result = await leaveGroupGift(await commandContext(api), { token, reservationId, claimsFor });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiNoContent(api.cors);
});

export const OPTIONS = apiPreflight;
