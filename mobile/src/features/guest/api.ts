import { api, done, ok, type Schemas } from "@/api/client";

import { proofHeaders, readWithProofs } from "./proofs";
import { forgetReservation, saveClaim, saveUnlock } from "./storage";

/**
 * Public routes of a list for the guest view (011, US4), like the site public page.
 * Always online: a reservation never goes through the offline write queue (FR-010b, principle III).
 * The bearer, if there is a session, is added by the client: the reservation is then tied to the account.
 */
/** The list, with its group gifts (028). */
async function fetchGuestList(readToken: string) {
  return ok(
    api.GET("/public/lists/{readToken}", {
      params: { path: { readToken }, query: { groupGifts: "true" }, header: await proofHeaders({ readToken }) },
    }),
  );
}

export async function readGuestList(readToken: string): Promise<Schemas["PublicList"]> {
  return readWithProofs({ readToken }, () => fetchGuestList(readToken));
}

export async function unlockGuestList(readToken: string, password: string): Promise<void> {
  const answer = await ok(api.POST("/public/lists/{readToken}/unlock", { params: { path: { readToken } }, body: { password } }));
  if (answer.unlockToken && answer.expiresAt) await saveUnlock(readToken, answer.unlockToken, answer.expiresAt);
}

export async function reserveGuestItem(
  readToken: string,
  input: {
    itemId: string;
    typeId?: string;
    fromName: string;
    note: string;
    /** « Lancer un cadeau commun » (028), with the amount put in, in cents. */
    group?: { amountCents: number | null };
  },
): Promise<{ groupGiftToken: string | null }> {
  const answer = await ok(
    api.POST("/public/lists/{readToken}/reservations", {
      params: { path: { readToken }, header: await proofHeaders({ readToken }, false) },
      body: {
        itemId: input.itemId,
        ...(input.typeId ? { typeId: input.typeId } : {}),
        fromName: input.fromName.trim(),
        note: input.note.trim(),
        ...(input.group ? { mode: "group" as const, amountCents: input.group.amountCents } : {}),
      },
    }),
  );
  if (answer.claim) {
    await saveClaim(
      { readToken, claimKey: answer.claimKey ?? null, giftToken: answer.groupGiftToken ?? null },
      answer.reservationId,
      answer.claim,
    );
  }
  return { groupGiftToken: answer.groupGiftToken ?? null };
}

export async function cancelGuestReservation(readToken: string, reservationId: string): Promise<void> {
  await done(
    api.DELETE("/public/lists/{readToken}/reservations/{reservationId}", {
      params: { path: { readToken, reservationId }, header: await proofHeaders({ readToken }) },
    }),
  );
  await forgetReservation(reservationId);
}
