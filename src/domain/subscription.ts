import { clone, findMembership } from "./access";
import { hasReadPassword } from "./read-password";
import type { Database, Subscription, Wishlist } from "./types";

/**
 * Lists that `userId` follows without being a member, with their subscription. Membership wins:
 * a list one is a member of is never a followed list (« Mes listes », export, account deletion).
 */
export function followedListsOf(
  doc: Database,
  userId: string,
): { wishlist: Wishlist; subscription: Subscription }[] {
  return doc.subscriptions.flatMap((subscription) => {
    if (subscription.userId !== userId || findMembership(doc, subscription.wishlistId, userId)) return [];
    const wishlist = doc.wishlists.find((entry) => entry.id === subscription.wishlistId);
    return wishlist ? [{ wishlist, subscription }] : [];
  });
}

/** A visitor's relation to a public list: member, or subscriber without being a member. */
export function viewerRelation(
  doc: Database,
  wishlistId: string,
  userId: string | null,
): { isMember: boolean; subscribed: boolean } {
  if (userId === null) return { isMember: false, subscribed: false };
  const isMember = findMembership(doc, wishlistId, userId) !== null;
  return { isMember, subscribed: !isMember && findSubscription(doc, wishlistId, userId) !== null };
}

export function findSubscription(
  doc: Database,
  wishlistId: string,
  userId: string,
): Subscription | null {
  return (
    doc.subscriptions.find(
      (entry) => entry.wishlistId === wishlistId && entry.userId === userId,
    ) ?? null
  );
}

/**
 * Tells whether the subscription gives read access without typing the password again:
 * true if the list has no password or if the stored hash matches the list's.
 */
export function isSubscriptionUnlocked(wishlist: Wishlist, subscription: Subscription): boolean {
  if (!hasReadPassword(wishlist)) return true;
  return subscription.readPasswordHash === wishlist.readPasswordHash;
}

/**
 * Subscribes `userId` to `wishlistId`.
 * - `verifiedHash`: hash of the read password against which the caller checked access
 *   (`null` for a list without a password). If the list's password changed in the meantime,
 *   refuses with `readPasswordChanged`: the subscription must never store an unverified hash.
 * - Refuses with `alreadyMember` if the user is already a member of the list.
 * - Idempotent: if the subscription already exists, updates `readPasswordHash` and returns `replayed: true`.
 */
export function subscribeWishlist(
  doc: Database,
  input: { wishlistId: string; userId: string; verifiedHash: string | null; now?: Date },
):
  | { ok: true; doc: Database; subscription: Subscription; replayed: boolean }
  | { ok: false; error: "listMissing" | "accountMissing" | "alreadyMember" | "readPasswordChanged" } {
  const wishlist = doc.wishlists.find((entry) => entry.id === input.wishlistId);
  if (!wishlist) return { ok: false, error: "listMissing" };
  if (!doc.users.some((entry) => entry.id === input.userId)) {
    return { ok: false, error: "accountMissing" };
  }
  if (findMembership(doc, wishlist.id, input.userId)) {
    return { ok: false, error: "alreadyMember" };
  }
  if (wishlist.readPasswordHash !== input.verifiedHash) {
    return { ok: false, error: "readPasswordChanged" };
  }
  const existing = findSubscription(doc, wishlist.id, input.userId);
  if (existing) {
    if (existing.readPasswordHash === wishlist.readPasswordHash) {
      return { ok: true, doc, subscription: existing, replayed: true };
    }
    const next = clone(doc);
    const target = findSubscription(next, wishlist.id, input.userId)!;
    target.readPasswordHash = wishlist.readPasswordHash;
    return { ok: true, doc: next, subscription: target, replayed: true };
  }
  const next = clone(doc);
  const subscription: Subscription = {
    wishlistId: wishlist.id,
    userId: input.userId,
    readPasswordHash: wishlist.readPasswordHash,
    createdAt: (input.now ?? new Date()).toISOString(),
  };
  next.subscriptions.push(subscription);
  return { ok: true, doc: next, subscription, replayed: false };
}

/**
 * Updates `readPasswordHash` of an existing subscription after the list is unlocked.
 * `verifiedHash` is the hash against which the typed password was checked: if the list's
 * password changed in the meantime, nothing is updated.
 */
export function syncSubscriptionUnlock(
  doc: Database,
  input: { wishlistId: string; userId: string; verifiedHash: string | null },
): Database {
  const wishlist = doc.wishlists.find((entry) => entry.id === input.wishlistId);
  const existing = findSubscription(doc, input.wishlistId, input.userId);
  if (!wishlist || !existing || wishlist.readPasswordHash !== input.verifiedHash) return doc;
  if (existing.readPasswordHash === wishlist.readPasswordHash) return doc;
  const next = clone(doc);
  const target = findSubscription(next, input.wishlistId, input.userId)!;
  target.readPasswordHash = wishlist.readPasswordHash;
  return next;
}

/**
 * Removes the subscription of `userId` to `wishlistId`.
 * Reservations made by `userId` on this list are not touched.
 */
export function unsubscribeWishlist(
  doc: Database,
  input: { wishlistId: string; userId: string },
): { ok: true; doc: Database } | { ok: false; error: "listMissing" } {
  const existing = findSubscription(doc, input.wishlistId, input.userId);
  if (!existing) return { ok: false, error: "listMissing" };
  const next = clone(doc);
  next.subscriptions = next.subscriptions.filter(
    (entry) => !(entry.wishlistId === input.wishlistId && entry.userId === input.userId),
  );
  return { ok: true, doc: next };
}
