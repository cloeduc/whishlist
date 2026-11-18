import { groupGiftTotals } from "./group-gift";
import { formatPrice } from "./price";
import type { Database, GroupGiftStatus, Reservation } from "./types";

export interface OffrirRow {
  /** Reservation on one's own; for a group gift, its first participation (a stable key). */
  reservationId: string;
  itemName: string;
  typeLabel: string;
  fromName: string | null;
  note: string | null;
  /**
   * A group gift (028) is one row with each participation. Members see names and messages,
   * never amounts nor the participants' thread.
   */
  groupGift: {
    id: string;
    status: GroupGiftStatus;
    participants: { reservationId: string; fromName: string | null; note: string | null }[];
  } | null;
}

export interface MyOfferRow {
  reservationId: string;
  itemName: string;
  listTitle: string;
  listReadToken: string;
  typeLabel: string;
  priceLabel: string | null;
  fromName: string | null;
  note: string | null;
  createdAt: string;
  /** Participation in a group gift (028): its link, state, the person's share and what is left. */
  groupGift: { token: string; status: GroupGiftStatus; amountCents: number | null; remainingCents: number | null } | null;
}

export function listOffrir(doc: Database, wishlistId: string): OffrirRow[] {
  return toOffrirRows(
    doc,
    doc.reservations.filter((r) => r.wishlistId === wishlistId),
  );
}

/** Rows of the Reservations tab for the given reservations (idea, category, giver, note). */
export function toOffrirRows(doc: Database, reservations: readonly Reservation[]): OffrirRow[] {
  const rows: OffrirRow[] = [];
  const giftRows = new Map<string, OffrirRow>();
  for (const reservation of reservations) {
    const giftRow = reservation.groupGiftId ? giftRows.get(reservation.groupGiftId) : undefined;
    const participant = { reservationId: reservation.id, fromName: reservation.fromName, note: reservation.note };
    if (giftRow?.groupGift) {
      giftRow.groupGift.participants.push(participant);
      continue;
    }
    const item = doc.items.find((i) => i.id === reservation.itemId);
    const type = item ? doc.types.find((t) => t.id === item.typeId) : undefined;
    const gift = reservation.groupGiftId ? doc.groupGifts.find((g) => g.id === reservation.groupGiftId) : undefined;
    const row: OffrirRow = {
      reservationId: reservation.id,
      itemName: item?.name ?? "—",
      typeLabel: type?.label ?? "",
      fromName: gift ? null : reservation.fromName,
      note: gift ? null : reservation.note,
      groupGift: gift ? { id: gift.id, status: gift.status, participants: [participant] } : null,
    };
    if (gift) giftRows.set(gift.id, row);
    rows.push(row);
  }
  return rows;
}

/** Gifts reserved while signed in (userId on the reservation). */
export function listMyOffers(doc: Database, userId: string, locale = "fr-FR"): MyOfferRow[] {
  return doc.reservations
    .filter((r) => r.userId === userId)
    .map((reservation) => {
      const list = doc.wishlists.find((entry) => entry.id === reservation.wishlistId);
      const item = doc.items.find((i) => i.id === reservation.itemId);
      const type = item ? doc.types.find((t) => t.id === item.typeId) : undefined;
      const gift = reservation.groupGiftId ? doc.groupGifts.find((g) => g.id === reservation.groupGiftId) : undefined;
      return {
        reservationId: reservation.id,
        itemName: item?.name ?? "—",
        listTitle: list?.title ?? "—",
        listReadToken: list?.readToken ?? "",
        typeLabel: type?.label ?? "",
        priceLabel: formatPrice(item?.priceCents ?? null, locale),
        fromName: reservation.fromName,
        note: reservation.note,
        createdAt: reservation.createdAt,
        groupGift: gift
          ? {
              token: gift.token,
              status: gift.status,
              amountCents: reservation.amountCents,
              remainingCents: groupGiftTotals(doc, gift, item).remainingCents,
            }
          : null,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
