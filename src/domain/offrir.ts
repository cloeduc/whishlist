import { formatPrice } from "./price";
import type { Database } from "./types";

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
  return doc.reservations
    .filter((r) => r.wishlistId === wishlistId)
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

/** Cadeaux réservés en étant connecté (userId sur la réservation). */
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
