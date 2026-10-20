import { findMembership } from "../domain/access";
import { hasReadPassword } from "../domain/read-password";
import type { Database, User, Wishlist } from "../domain/types";
import { hasReadUnlock } from "./read-unlock";

/** Accès page publique : pas de MDP, ou cookie unlock, ou membre connecté. */
export async function canAccessPublicList(
  doc: Database,
  list: Wishlist,
  user: User | null,
): Promise<boolean> {
  if (!hasReadPassword(list)) return true;
  if (user && findMembership(doc, list.id, user.id)) return true;
  return hasReadUnlock(list);
}
