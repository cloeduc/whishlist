import { guestProofs } from "@/src/server/api/auth";
import { commandContext } from "@/src/server/api/context";
import { apiError, apiJson, apiPreflight, readJsonBody, text, withApi } from "@/src/server/api/http";
import { reserve } from "@/src/server/commands/public-list";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApi<{ readToken: string }>(async (api, { readToken }) => {
  const body = await readJsonBody(api.req);
  if (!body.ok) return apiError(body.error, api.locale, api.cors);
  const result = await reserve(await commandContext(api), {
    readToken,
    itemId: text(body.body.itemId),
    typeId: text(body.body.typeId),
    fromName: text(body.body.fromName),
    note: text(body.body.note),
    isUnlocked: guestProofs(api.req, readToken).isUnlocked,
  });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiJson({ reservationId: result.reservation.id, claim: result.claim }, 201, api.cors);
});

export const OPTIONS = apiPreflight;
