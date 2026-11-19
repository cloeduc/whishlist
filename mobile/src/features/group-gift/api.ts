import { api, done, ok, type Schemas } from "@/api/client";
import { proofHeaders, readWithProofs, unlockKey } from "@/features/guest/proofs";
import { forgetReservation, saveClaim, saveUnlock } from "@/features/guest/storage";

/**
 * Routes of a group gift reached by its own link (028). The app files the unlock token under
 * `gift:<token>` and the claims under the gift's token and the list's claim key: the gift's link
 * never gives the list's read link. Always online, like a reservation.
 */
const scope = (token: string) => ({ giftToken: token });
const headers = (token: string) => proofHeaders(scope(token));

async function fetchGift(token: string) {
  return ok(api.GET("/public/group-gifts/{token}", { params: { path: { token }, header: await headers(token) } }));
}

export async function readGroupGift(token: string): Promise<Schemas["GroupGift"]> {
  return readWithProofs(scope(token), () => fetchGift(token));
}

export async function unlockGroupGift(token: string, password: string): Promise<void> {
  const answer = await ok(api.POST("/public/group-gifts/{token}/unlock", { params: { path: { token } }, body: { password } }));
  if (answer.unlockToken && answer.expiresAt) await saveUnlock(unlockKey(scope(token)), answer.unlockToken, answer.expiresAt);
}

export async function joinGroupGift(
  token: string,
  input: { fromName: string; note: string; amountCents: number | null },
): Promise<void> {
  const answer = await ok(
    api.POST("/public/group-gifts/{token}/participations", {
      params: { path: { token }, header: await headers(token) },
      body: { fromName: input.fromName.trim(), note: input.note.trim(), amountCents: input.amountCents },
    }),
  );
  if (answer.claim) await saveClaim({ giftToken: token, claimKey: answer.claimKey }, answer.reservationId, answer.claim);
}

export async function leaveGroupGift(token: string, reservationId: string): Promise<void> {
  await done(
    api.DELETE("/public/group-gifts/{token}/participations/{reservationId}", {
      params: { path: { token, reservationId }, header: await headers(token) },
    }),
  );
  await forgetReservation(reservationId);
}

export async function setGroupGiftStatus(token: string, status: "open" | "complete"): Promise<Schemas["GroupGift"]> {
  return ok(
    api.PUT("/public/group-gifts/{token}/status", { params: { path: { token }, header: await headers(token) }, body: { status } }),
  );
}

export async function setGroupGiftAmount(
  token: string,
  reservationId: string,
  amountCents: number | null,
): Promise<Schemas["GroupGift"]> {
  return ok(
    api.PATCH("/public/group-gifts/{token}/participations/{reservationId}", {
      params: { path: { token, reservationId }, header: await headers(token) },
      body: { amountCents },
    }),
  );
}

/** A message in the participants' thread (US5): sent with the session and the unlock, the server checks the participation. */
export async function postGroupGiftMessage(token: string, body: string): Promise<void> {
  await ok(
    api.POST("/public/group-gifts/{token}/messages", {
      params: { path: { token }, header: await proofHeaders(scope(token), false) },
      body: { body: body.trim() },
    }),
  );
}

export async function deleteGroupGiftMessage(token: string, messageId: string): Promise<void> {
  await done(
    api.DELETE("/public/group-gifts/{token}/messages/{messageId}", {
      params: { path: { token, messageId }, header: await proofHeaders(scope(token), false) },
    }),
  );
}
