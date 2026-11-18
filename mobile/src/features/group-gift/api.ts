import { api, ApiError, done, ok, type Schemas } from "@/api/client";
import {
  claimsForScope,
  forgetReservation,
  forgetUnlock,
  rememberClaimKey,
  saveClaim,
  saveUnlock,
  unlockTokenFor,
} from "@/features/guest/storage";

/**
 * Routes of a group gift reached by its own link (028). The app files the unlock token under
 * `gift:<token>` and the claims under the gift's token and the list's claim key: the gift's link
 * never gives the list's read link. Always online, like a reservation.
 */
const unlockKey = (token: string) => `gift:${token}`;

async function headers(token: string) {
  const [unlock, claims] = await Promise.all([unlockTokenFor(unlockKey(token)), claimsForScope({ giftToken: token })]);
  return {
    ...(unlock ? { "X-Read-Unlock": unlock } : {}),
    ...(claims.length ? { "X-Reservation-Claims": claims.join(",") } : {}),
  };
}

async function fetchGift(token: string) {
  return ok(api.GET("/public/group-gifts/{token}", { params: { path: { token }, header: await headers(token) } }));
}

export async function readGroupGift(token: string): Promise<Schemas["GroupGift"]> {
  try {
    const sent = await claimsForScope({ giftToken: token });
    const gift = await fetchGift(token);
    // Claims made from the list are filed under its claim key, known only now.
    await rememberClaimKey({ giftToken: token }, gift.claimKey);
    const known = await claimsForScope({ giftToken: token });
    return known.length > sent.length ? await fetchGift(token) : gift;
  } catch (error) {
    if (error instanceof ApiError && error.code === "readPasswordRequired") await forgetUnlock(unlockKey(token));
    throw error;
  }
}

export async function unlockGroupGift(token: string, password: string): Promise<void> {
  const answer = await ok(api.POST("/public/group-gifts/{token}/unlock", { params: { path: { token } }, body: { password } }));
  if (answer.unlockToken && answer.expiresAt) await saveUnlock(unlockKey(token), answer.unlockToken, answer.expiresAt);
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

/** A message in the participants' thread (US5): sent with the session, the server checks the participation. */
export async function postGroupGiftMessage(token: string, body: string): Promise<void> {
  await ok(api.POST("/public/group-gifts/{token}/messages", { params: { path: { token } }, body: { body: body.trim() } }));
}

export async function deleteGroupGiftMessage(token: string, messageId: string): Promise<void> {
  await done(api.DELETE("/public/group-gifts/{token}/messages/{messageId}", { params: { path: { token, messageId } } }));
}
