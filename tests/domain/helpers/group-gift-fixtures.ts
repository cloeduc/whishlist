import type { Database, GroupGift, Reservation } from "../../../src/domain/types";
import { apiDoc } from "./api-fixtures";

export function gift(id: string, itemId: string, extra: Partial<GroupGift> = {}): GroupGift {
  return {
    id,
    wishlistId: "w",
    itemId,
    token: `tok-${id}`,
    status: "open",
    createdAt: "2026-01-03T00:00:00.000Z",
    completedAt: null,
    ...extra,
  };
}

export function chipIn(id: string, groupGiftId: string, itemId: string, extra: Partial<Reservation> = {}): Reservation {
  return {
    id,
    wishlistId: "w",
    itemId,
    fromName: null,
    note: null,
    userId: null,
    createdAt: "2026-01-03T00:00:00.000Z",
    groupGiftId,
    amountCents: null,
    ...extra,
  };
}

/** `apiDoc()` with a group gift `g` on the idea `gift` (19,90 €): Sam puts in 5 €, Alex (account) 10 €. */
export function docWithGroupGift(): Database {
  const doc = apiDoc();
  doc.groupGifts.push(gift("g", "gift"));
  doc.reservations.push(
    chipIn("p-sam", "g", "gift", { fromName: "Sam", amountCents: 500 }),
    chipIn("p-alex", "g", "gift", { fromName: "Alex", userId: "alex", amountCents: 1000, note: "Je l'achète" }),
  );
  return doc;
}
