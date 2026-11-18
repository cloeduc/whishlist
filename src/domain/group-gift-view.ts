import type { Database, GroupGift, GroupGiftStatus, Item, Reservation } from "./types";

/**
 * Reading a group gift (028): pure, without Node modules, so the app can reuse it through `read.ts`
 * and `filters.ts` (like `price.ts`). The writes are in `group-gift.ts`.
 */

export function findGroupGiftByToken(doc: Database, token: string): GroupGift | null {
  if (!token) return null;
  return doc.groupGifts.find((gift) => gift.token === token) ?? null;
}

export function groupGiftOfItem(doc: Database, itemId: string): GroupGift | null {
  return doc.groupGifts.find((gift) => gift.itemId === itemId) ?? null;
}

export function participationsOf(doc: Database, groupGiftId: string): Reservation[] {
  return doc.reservations.filter((r) => r.groupGiftId === groupGiftId);
}

/** The visitor's own participation: linked to their account, or proven by a claim. */
export function ownParticipation(
  doc: Database,
  groupGiftId: string,
  userId: string | null,
  claimedIds: ReadonlySet<string>,
): Reservation | null {
  return (
    participationsOf(doc, groupGiftId).find(
      (r) => (userId !== null && r.userId === userId) || claimedIds.has(r.id),
    ) ?? null
  );
}

export interface GroupGiftTotals {
  participantCount: number;
  totalCents: number;
  /** What is left to gather; null when the idea has no price. Never negative. */
  remainingCents: number | null;
  goalReached: boolean;
}

/** Totals against the idea's current price (a price changed by a member recomputes what is left). */
export function groupGiftTotals(doc: Database, gift: GroupGift, item?: Item): GroupGiftTotals {
  const participations = participationsOf(doc, gift.id);
  const totalCents = participations.reduce((sum, r) => sum + (r.amountCents ?? 0), 0);
  const priceCents = (item ?? doc.items.find((i) => i.id === gift.itemId))?.priceCents ?? null;
  return {
    participantCount: participations.length,
    totalCents,
    remainingCents: priceCents === null ? null : Math.max(0, priceCents - totalCents),
    goalReached: priceCents !== null && totalCents >= priceCents,
  };
}

export interface GroupGiftSummary extends GroupGiftTotals {
  token: string;
  status: GroupGiftStatus;
  /** The visitor chips in. */
  mine: boolean;
}

export function groupGiftSummary(doc: Database, gift: GroupGift, mineReservationIds: ReadonlySet<string>): GroupGiftSummary {
  return {
    token: gift.token,
    status: gift.status,
    ...groupGiftTotals(doc, gift),
    mine: participationsOf(doc, gift.id).some((r) => mineReservationIds.has(r.id)),
  };
}
