import { clone, findMembership } from "./access";
import type { Database, Item, Reservation } from "./types";

/**
 * « Garder la surprise » (feature 020): a member may choose not to see what was reserved on a list.
 * The choice belongs to the member (one flag per membership); other members and guests are unaffected.
 */

export type MemberShelf = "ideas" | "archives";

export function surpriseModeOf(doc: Database, wishlistId: string, userId: string): boolean {
  return findMembership(doc, wishlistId, userId)?.surpriseMode ?? false;
}

/** Reservations a member is shown with the list: none in surprise mode, until they ask (« Voir les réservations »). */
export function visibleReservations(doc: Database, wishlistId: string, userId: string): Reservation[] {
  if (surpriseModeOf(doc, wishlistId, userId)) return [];
  return doc.reservations.filter((r) => r.wishlistId === wishlistId);
}

/**
 * Where a member sees an idea. Outside surprise mode a reserved idea sits in the archives, as before 020.
 * In surprise mode only an idea a member archived goes there: a reserved idea looks like any other.
 */
export function memberShelf(item: Item, reserved: boolean, surprise: boolean): MemberShelf {
  if (item.archived) return "archives";
  return reserved && !surprise ? "archives" : "ideas";
}

export function setSurpriseMode(
  doc: Database,
  input: { wishlistId: string; actorId: string; enabled: boolean },
): { ok: true; doc: Database } | { ok: false; error: string } {
  if (!findMembership(doc, input.wishlistId, input.actorId)) return { ok: false, error: "notMember" };
  const next = clone(doc);
  const membership = findMembership(next, input.wishlistId, input.actorId);
  if (membership) membership.surpriseMode = input.enabled;
  return { ok: true, doc: next };
}

/** The idea as `userId` sees it: `archived` tells its shelf (a reserved idea is « archived » outside surprise mode). */
export function asSeenBy(doc: Database, item: Item, userId: string): Item {
  const reserved = doc.reservations.some((r) => r.itemId === item.id);
  const archived = memberShelf(item, reserved, surpriseModeOf(doc, item.wishlistId, userId)) === "archives";
  return archived === item.archived ? item : { ...item, archived };
}
