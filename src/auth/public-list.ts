import "server-only";
import { findMembership } from "../domain/access";
import { hasReadPassword } from "../domain/read-password";
import { findSubscription, isSubscriptionUnlocked } from "../domain/subscription";
import type { Database, User, Wishlist } from "../domain/types";
import { hasReadUnlock } from "./read-unlock";

/** Public page access: no password, or proven unlock, or signed-in member, or up-to-date subscriber. */
export async function canAccessPublicListWith(
  doc: Database,
  list: Wishlist,
  user: User | null,
  isUnlocked: (list: Wishlist) => boolean | Promise<boolean>,
): Promise<boolean> {
  if (!hasReadPassword(list)) return true;
  if (user && findMembership(doc, list.id, user.id)) return true;
  if (user && !user.mustChangePassword) {
    const subscription = findSubscription(doc, list.id, user.id);
    if (subscription && isSubscriptionUnlocked(list, subscription)) return true;
  }
  return isUnlocked(list);
}

/** Site version: the unlock comes from the cookie. */
export async function canAccessPublicList(
  doc: Database,
  list: Wishlist,
  user: User | null,
): Promise<boolean> {
  return canAccessPublicListWith(doc, list, user, hasReadUnlock);
}
