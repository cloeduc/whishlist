import { commandContext } from "@/src/server/api/context";
import { apiError, apiJson, apiPreflight, withApi } from "@/src/server/api/http";
import { revealReservations } from "@/src/server/commands/lists";

export const runtime = "nodejs";

/** Reservations on demand, whatever the surprise mode (020): « Voir les réservations ». */
export const GET = withApi<{ listId: string }>(async (api, { listId }) => {
  const result = await revealReservations(await commandContext(api), { wishlistId: listId });
  if (!result.ok) return apiError(result.error, api.locale, api.cors);
  return apiJson({ reservations: result.reservations }, 200, api.cors);
});

export const OPTIONS = apiPreflight;
