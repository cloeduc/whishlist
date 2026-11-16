import { formatPrice } from "./price";
import type { Database, Reservation } from "./types";

export interface OffrirRow {
  reservationId: string;
  itemName: string;
  typeLabel: string;
  fromName: string | null;
  note: string | null;
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
}

export function listOffrir(doc: Database, wishlistId: string): OffrirRow[] {
  return toOffrirRows(
    doc,
    doc.reservations.filter((r) => r.wishlistId === wishlistId),
  );
}

/** Rows of the Reservations tab for the given reservations (idea, category, giver, note). */
export function toOffrirRows(doc: Database, reservations: readonly Reservation[]): OffrirRow[] {
  return reservations
    .map((reservation) => {
      const item = doc.items.find((i) => i.id === reservation.itemId);
      const type = item ? doc.types.find((t) => t.id === item.typeId) : undefined;
      return {
        reservationId: reservation.id,
        itemName: item?.name ?? "—",
        typeLabel: type?.label ?? "",
        fromName: reservation.fromName,
        note: reservation.note,
      };
    });
}

/** Gifts reserved while signed in (userId on the reservation). */
export function listMyOffers(doc: Database, userId: string, locale = "fr-FR"): MyOfferRow[] {
  return doc.reservations
    .filter((r) => r.userId === userId)
    .map((reservation) => {
      const list = doc.wishlists.find((entry) => entry.id === reservation.wishlistId);
      const item = doc.items.find((i) => i.id === reservation.itemId);
      const type = item ? doc.types.find((t) => t.id === item.typeId) : undefined;
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
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
