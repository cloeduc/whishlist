import { api, ApiError, done, ok, type Schemas } from "@/api/client";

import { claimsFor, forgetReservation, forgetUnlock, saveClaim, saveUnlock, unlockTokenFor } from "./storage";

/**
 * Public routes of a list for the guest view (011, US4), like the site public page.
 * Always online: a reservation never goes through the offline write queue (FR-010b, principle III).
 * The bearer, if there is a session, is added by the client: the reservation is then tied to the account.
 */
async function proofHeaders(readToken: string, withClaims: boolean) {
  const [unlock, claims] = await Promise.all([unlockTokenFor(readToken), withClaims ? claimsFor(readToken) : []]);
  return {
    ...(unlock ? { "X-Read-Unlock": unlock } : {}),
    ...(claims.length ? { "X-Reservation-Claims": claims.join(",") } : {}),
  };
}

export async function readGuestList(readToken: string): Promise<Schemas["PublicList"]> {
  try {
    return await ok(
      api.GET("/public/lists/{readToken}", {
        params: { path: { readToken }, header: await proofHeaders(readToken, true) },
      }),
    );
  } catch (error) {
    // Token refused (password changed since): forget it, the list asks for the password again.
    if (error instanceof ApiError && error.code === "readPasswordRequired") await forgetUnlock(readToken);
    throw error;
  }
}

export async function unlockGuestList(readToken: string, password: string): Promise<void> {
  const answer = await ok(api.POST("/public/lists/{readToken}/unlock", { params: { path: { readToken } }, body: { password } }));
  if (answer.unlockToken && answer.expiresAt) await saveUnlock(readToken, answer.unlockToken, answer.expiresAt);
}

export async function reserveGuestItem(
  readToken: string,
  input: { itemId: string; typeId?: string; fromName: string; note: string },
): Promise<void> {
  const answer = await ok(
    api.POST("/public/lists/{readToken}/reservations", {
      params: { path: { readToken }, header: await proofHeaders(readToken, false) },
      body: {
        itemId: input.itemId,
        ...(input.typeId ? { typeId: input.typeId } : {}),
        fromName: input.fromName.trim(),
        note: input.note.trim(),
      },
    }),
  );
  if (answer.claim) await saveClaim(readToken, answer.reservationId, answer.claim);
}

export async function cancelGuestReservation(readToken: string, reservationId: string): Promise<void> {
  await done(
    api.DELETE("/public/lists/{readToken}/reservations/{reservationId}", {
      params: { path: { readToken, reservationId }, header: await proofHeaders(readToken, true) },
    }),
  );
  await forgetReservation(reservationId);
}
