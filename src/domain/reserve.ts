import { clone } from "./access";
import { newId } from "./tokens";
import type { Database, Reservation } from "./types";

function blank(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed ? trimmed : null;
}

export function availableItems(doc: Database, wishlistId: string, typeId: string) {
  const reserved = new Set(doc.reservations.filter((r) => r.wishlistId === wishlistId).map((r) => r.itemId));
  return doc.items
    .filter((item) => item.wishlistId === wishlistId && !item.archived && !reserved.has(item.id))
    .filter((item) => (typeId ? item.typeId === typeId : true))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
}

export function reserveItem(
  doc: Database,
  input: {
    wishlistId: string;
    itemId: string;
    typeId?: string;
    fromName?: string | null;
    note?: string | null;
    now?: Date;
    id?: string;
  },
): { ok: true; doc: Database; reservation: Reservation } | { ok: false; error: string } {
  if (!input.itemId) return { ok: false, error: "chooseItem" };
  const item = doc.items.find((i) => i.id === input.itemId && i.wishlistId === input.wishlistId);
  if (!item || item.archived) return { ok: false, error: "itemNotInList" };
  if (input.typeId && item.typeId !== input.typeId) {
    return { ok: false, error: "itemWrongType" };
  }
  if (doc.reservations.some((r) => r.itemId === item.id)) {
    return { ok: false, error: "itemAlreadyReserved" };
  }
  const reservation: Reservation = {
    id: input.id ?? newId(),
    wishlistId: input.wishlistId,
    itemId: item.id,
    fromName: blank(input.fromName),
    note: blank(input.note),
    createdAt: (input.now ?? new Date()).toISOString(),
  };
  const next = clone(doc);
  const nextItem = next.items.find((i) => i.id === item.id);
  if (nextItem) nextItem.archived = true;
  next.reservations.push(reservation);
  return { ok: true, doc: next, reservation };
}
