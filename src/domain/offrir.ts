import type { Database } from "./types";

export interface OffrirRow {
  reservationId: string;
  itemName: string;
  typeLabel: string;
  fromName: string | null;
  note: string | null;
}

export function listOffrir(doc: Database, wishlistId: string): OffrirRow[] {
  return doc.reservations
    .filter((r) => r.wishlistId === wishlistId)
    .map((reservation) => {
      const item = doc.items.find((i) => i.id === reservation.itemId);
      const type = item ? doc.types.find((t) => t.id === item.typeId) : undefined;
      return {
        reservationId: reservation.id,
        itemName: item?.name ?? "Idée retirée",
        typeLabel: type?.label ?? "",
        fromName: reservation.fromName,
        note: reservation.note,
      };
    });
}
