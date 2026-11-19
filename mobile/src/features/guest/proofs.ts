import { ApiError } from "@/api/client";

import { claimsForScope, forgetUnlock, rememberClaimKey, unlockTokenFor } from "./storage";

/**
 * Proofs a visitor sends without being a member: the list's unlock token and the claims of their
 * reservations. A list is reached by its read link, a group gift (028) by its own link only: its unlock
 * token is filed under `gift:<token>` and its claims under the gift's token and the list's claim key.
 */
export type ProofScope = { readToken: string } | { giftToken: string };

/** Where the unlock token of a list or a gift is filed. */
export function unlockKey(scope: ProofScope): string {
  return "readToken" in scope ? scope.readToken : `gift:${scope.giftToken}`;
}

export async function proofHeaders(scope: ProofScope, withClaims = true) {
  const [unlock, claims] = await Promise.all([unlockTokenFor(unlockKey(scope)), withClaims ? claimsForScope(scope) : []]);
  return {
    ...(unlock ? { "X-Read-Unlock": unlock } : {}),
    ...(claims.length ? { "X-Reservation-Claims": claims.join(",") } : {}),
  };
}

/**
 * Reads a list or a gift with the proofs. Claims made from the other link are filed under the list's
 * claim key, known only from the answer: when it brings new ones, it reads again with them. A refused
 * unlock token (password changed since) is forgotten, so the screen asks for the password again.
 */
export async function readWithProofs<T extends { claimKey: string }>(scope: ProofScope, fetch: () => Promise<T>): Promise<T> {
  try {
    const sent = await claimsForScope(scope);
    const answer = await fetch();
    await rememberClaimKey(scope, answer.claimKey);
    const known = await claimsForScope(scope);
    return known.length > sent.length ? await fetch() : answer;
  } catch (error) {
    if (error instanceof ApiError && error.code === "readPasswordRequired") await forgetUnlock(unlockKey(scope));
    throw error;
  }
}
