import { clone } from "./access";
import { blankToNull } from "./text";
import { newId } from "./tokens";
import type { Database, Item, Reservation } from "./types";

/** Maximum lengths of the giver's name and of the note. */
export const MAX_FROM_NAME = 200;
export const MAX_NOTE = 2000;

/** Ideas of a list that someone has reserved. */
export function reservedItemIds(doc: Database, wishlistId: string): Set<string> {
  return new Set(doc.reservations.filter((r) => r.wishlistId === wishlistId).map((r) => r.itemId));
}

export function availableItems(doc: Database, wishlistId: string, typeId: string) {
  const reserved = reservedItemIds(doc, wishlistId);
  return doc.items
    .filter((item) => item.wishlistId === wishlistId && !item.archived && !reserved.has(item.id))
    .filter((item) => (typeId ? item.typeId === typeId : true))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
}

/**
 * Checks shared by « Réserver seul » and « Lancer un cadeau commun » (028): the idea exists in the list,
 * is not archived, is still free, and the giver's fields fit.
 */
export function reservableItem(
  doc: Database,
  input: { wishlistId: string; itemId: string; typeId?: string; fromName?: string | null; note?: string | null },
): { ok: true; item: Item } | { ok: false; error: string } {
  if (!input.itemId) return { ok: false, error: "chooseItem" };
  if ((input.fromName ?? "").length > MAX_FROM_NAME || (input.note ?? "").length > MAX_NOTE) {
    return { ok: false, error: "fieldTooLong" };
  }
  const item = doc.items.find((i) => i.id === input.itemId && i.wishlistId === input.wishlistId);
  // An already reserved idea (a group gift's participations included): we say why it can no longer be offered.
  if (item && doc.reservations.some((r) => r.itemId === item.id)) {
    return { ok: false, error: "itemAlreadyReserved" };
  }
  if (!item || item.archived) return { ok: false, error: "itemNotInList" };
  if (input.typeId && item.typeId !== input.typeId) {
    return { ok: false, error: "itemWrongType" };
  }
  return { ok: true, item };
}

export function reserveItem(
  doc: Database,
  input: {
    wishlistId: string;
    itemId: string;
    typeId?: string;
    fromName?: string | null;
    note?: string | null;
    userId?: string | null;
    now?: Date;
    id?: string;
  },
): { ok: true; doc: Database; reservation: Reservation } | { ok: false; error: string } {
  const checked = reservableItem(doc, input);
  if (!checked.ok) return checked;
  const reservation: Reservation = {
    id: input.id ?? newId(),
    wishlistId: input.wishlistId,
    itemId: checked.item.id,
    fromName: blankToNull(input.fromName),
    note: blankToNull(input.note),
    userId: input.userId?.trim() ? input.userId.trim() : null,
    createdAt: (input.now ?? new Date()).toISOString(),
    groupGiftId: null,
    amountCents: null,
  };
  // The idea is not archived: the reservation alone says it is taken (020).
  const next = clone(doc);
  next.reservations.push(reservation);
  return { ok: true, doc: next, reservation };
}
