import { claimKeyFor, signReservationClaim } from "@/src/auth/reservation-claim";
import { sessionSecret } from "@/src/auth/session";
import { guestProofsForList } from "@/src/server/api/auth";
import { commandContext } from "@/src/server/api/context";
import { apiError, apiJson, apiPreflight, readJsonBody, text, withApi } from "@/src/server/api/http";
import { amountField } from "@/src/server/api/group-gift";
import { joinGroupGift } from "@/src/server/commands/group-gift";

export const runtime = "nodejs";

export const POST = withApi<{ token: string }>(async (api, { token }) => {
  const body = await readJsonBody(api.req);
  if (!body.ok) return apiError(body.error, api.locale, api.cors);
  const amount = amountField(body.body.amountCents);
  if (amount === "invalid") return apiError("invalidAmount", api.locale, api.cors);
  const result = await joinGroupGift(await commandContext(api), {
    token,
    fromName: text(body.body.fromName),
    note: text(body.body.note),
    amount,
    ...guestProofsForList(api.req),
  });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  const secret = sessionSecret();
  const { readToken } = result.wishlist;
  return apiJson(
    {
      reservationId: result.reservation.id,
      claim: secret ? signReservationClaim(readToken, result.reservation.id, secret) : null,
      claimKey: claimKeyFor(readToken),
    },
    201,
    api.cors,
  );
});

export const OPTIONS = apiPreflight;
