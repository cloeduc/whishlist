import { commandContext } from "@/src/server/api/context";
import { apiError, apiNoContent, apiPreflight, withApi } from "@/src/server/api/http";
import { cancelReservationAsMember } from "@/src/server/commands/items";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const DELETE = withApi<{ listId: string; reservationId: string }>(async (api, { listId, reservationId }) => {
  const result = await cancelReservationAsMember(await commandContext(api), { wishlistId: listId, reservationId });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiNoContent(api.cors);
});

export const OPTIONS = apiPreflight;
