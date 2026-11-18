import { groupGiftOfItem, groupGiftSummary, participationsOf, type GroupGiftSummary } from "./group-gift-view";
import { formatPrice } from "./price";
import type { Database, Item, View, Wishlist } from "./types";

export interface PublicItem {
  id: string;
  name: string;
  typeLabel: string;
  url: string | null;
  imageUrl: string | null;
  priceLabel: string | null;
  priority: string | null;
  secondHandOk: boolean;
  description: string | null;
  personLabel: string;
  reserved: boolean;
  /** Reservation made by the current visitor (account or cookie). */
  mine: boolean;
  reservationId: string | null;
  /** The idea is a group gift (028): what the visitor may see of it. */
  groupGift: GroupGiftSummary | null;
  sortOrder: number;
}

/** What the public list shows of group gifts (research R9). */
export interface PublicListOptions {
  /**
   * true for the site and the clients that know group gifts: an open group gift stays visible to everyone.
   * false for the apps released before 028: a group gift is a reservation (shown only to its participants).
   */
  groupGifts?: boolean;
}

export interface PublicWishlist {
  wishlist: Wishlist;
  items: PublicItem[];
  views: View[];
}

export function sortItems(items: Item[]): Item[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
}

export function findWishlistByReadToken(doc: Database, readToken: string): Wishlist | null {
  return doc.wishlists.find((w) => w.readToken === readToken) ?? null;
}

export function listItems(doc: Database, wishlistId: string): Item[] {
  return sortItems(doc.items.filter((item) => item.wishlistId === wishlistId && !item.archived));
}

export function toPublicItem(
  doc: Database,
  item: Item,
  locale = "fr-FR",
  mineReservationIds: ReadonlySet<string> = new Set(),
): PublicItem {
  const type = doc.types.find((t) => t.id === item.typeId);
  const person = doc.people.find((p) => p.id === item.personId);
  const single = doc.reservations.find((r) => r.itemId === item.id && r.groupGiftId === null);
  const gift = groupGiftOfItem(doc, item.id);
  const participation = gift ? participationsOf(doc, gift.id).find((r) => mineReservationIds.has(r.id)) : undefined;
  const reservation = single ?? participation;
  const mine = Boolean(reservation && mineReservationIds.has(reservation.id));
  return {
    id: item.id,
    name: item.name,
    typeLabel: type?.label ?? item.typeId,
    url: item.url,
    imageUrl: item.imageUrl ?? null,
    priceLabel: formatPrice(item.priceCents, locale),
    priority: item.priority,
    secondHandOk: item.secondHandOk,
    description: item.description,
    personLabel: person?.label ?? item.personId,
    reserved: Boolean(single || gift),
    mine,
    reservationId: reservation?.id ?? null,
    groupGift: gift ? groupGiftSummary(doc, gift, mineReservationIds) : null,
    sortOrder: item.sortOrder,
  };
}

/** Reservation ids that are « à moi »: signed-in account and/or claim cookies. */
export function mineReservationIdsFor(
  doc: Database,
  wishlistId: string,
  userId: string | null,
  claimedIds: ReadonlySet<string>,
): Set<string> {
  const ids = new Set<string>();
  for (const reservation of doc.reservations) {
    if (reservation.wishlistId !== wishlistId) continue;
    if (userId && reservation.userId === userId) ids.add(reservation.id);
    if (claimedIds.has(reservation.id)) ids.add(reservation.id);
  }
  return ids;
}

/**
 * Ideas visible publicly: free, or reserved by the visitor. A group gift (028) is visible to its participants;
 * with `groupGifts`, an open one is visible to everyone, a complete one only to its participants.
 */
export function listPublicVisibleItems(
  doc: Database,
  wishlistId: string,
  mineReservationIds: ReadonlySet<string>,
  options: PublicListOptions = {},
): Item[] {
  const listReservations = doc.reservations.filter((r) => r.wishlistId === wishlistId);
  const reservedItemIds = new Set(listReservations.map((r) => r.itemId));
  const mineItemIds = new Set(listReservations.filter((r) => mineReservationIds.has(r.id)).map((r) => r.itemId));
  const openGiftItemIds = new Set(
    doc.groupGifts.filter((g) => g.wishlistId === wishlistId && g.status === "open").map((g) => g.itemId),
  );
  return sortItems(
    doc.items.filter((item) => {
      if (item.wishlistId !== wishlistId) return false;
      if (mineItemIds.has(item.id)) return true;
      if (item.archived) return false;
      if (options.groupGifts && openGiftItemIds.has(item.id)) return true;
      return !reservedItemIds.has(item.id);
    }),
  );
}

export function getPublicWishlist(
  doc: Database,
  readToken: string,
  locale = "fr-FR",
  mineReservationIds: ReadonlySet<string> = new Set(),
  options: PublicListOptions = {},
): PublicWishlist | null {
  const wishlist = findWishlistByReadToken(doc, readToken);
  if (!wishlist) return null;
  const items = listPublicVisibleItems(doc, wishlist.id, mineReservationIds, options).map((item) =>
    toPublicItem(doc, item, locale, mineReservationIds),
  );
  const views = doc.views.filter((view) => view.wishlistId === wishlist.id);
  return { wishlist, items, views };
}
