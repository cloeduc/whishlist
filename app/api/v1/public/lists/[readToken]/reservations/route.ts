import { claimKeyFor } from "@/src/auth/reservation-claim";
import { guestProofs } from "@/src/server/api/auth";
import { commandContext } from "@/src/server/api/context";
import { apiError, apiJson, apiPreflight, readJsonBody, text, withApi } from "@/src/server/api/http";
import { amountField } from "@/src/server/api/group-gift";
import { reserve } from "@/src/server/commands/public-list";

export const runtime = "nodejs";

export const POST = withApi<{ readToken: string }>(async (api, { readToken }) => {
  const body = await readJsonBody(api.req);
  if (!body.ok) return apiError(body.error, api.locale, api.cors);
  // Since 1.11.0: « Lancer un cadeau commun » (028). Without `mode`, a reservation on one's own, as before.
  const mode = body.body.mode === "group" ? "group" : "single";
  const amount = mode === "group" ? amountField(body.body.amountCents) : null;
  if (amount === "invalid") return apiError("invalidAmount", api.locale, api.cors);
  const result = await reserve(await commandContext(api), {
    readToken,
    itemId: text(body.body.itemId),
    typeId: text(body.body.typeId),
    fromName: text(body.body.fromName),
    note: text(body.body.note),
    mode,
    amount,
    isUnlocked: guestProofs(api.req, readToken).isUnlocked,
  });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiJson(
    {
      reservationId: result.reservation.id,
      claim: result.claim,
      claimKey: claimKeyFor(readToken),
      groupGiftToken: result.groupGiftToken,
    },
    201,
    api.cors,
  );
});

export const OPTIONS = apiPreflight;
