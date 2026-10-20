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
  personLabel: string;
  reserved: boolean;
  sortOrder: number;
}

export interface PublicWishlist {
  wishlist: Wishlist;
  items: PublicItem[];
  views: View[];
}

function sortItems(items: Item[]): Item[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
}

export function listItems(doc: Database, wishlistId: string): Item[] {
  return sortItems(doc.items.filter((item) => item.wishlistId === wishlistId && !item.archived));
}

export function toPublicItem(doc: Database, item: Item): PublicItem {
  const type = doc.types.find((t) => t.id === item.typeId);
  const person = doc.people.find((p) => p.id === item.personId);
  return {
    id: item.id,
    name: item.name,
    typeLabel: type?.label ?? item.typeId,
    url: item.url,
    imageUrl: item.imageUrl ?? null,
    priceLabel: formatPrice(item.priceCents),
    priority: item.priority,
    personLabel: person?.label ?? item.personId,
    reserved: doc.reservations.some((r) => r.itemId === item.id),
    sortOrder: item.sortOrder,
  };
}

export function getPublicWishlist(doc: Database, readToken: string): PublicWishlist | null {
  const wishlist = doc.wishlists.find((w) => w.readToken === readToken);
  if (!wishlist) return null;
  const items = listItems(doc, wishlist.id)
    .map((item) => toPublicItem(doc, item))
    .filter((item) => !item.reserved);
  const views = doc.views.filter((view) => view.wishlistId === wishlist.id);
  return { wishlist, items, views };
}
