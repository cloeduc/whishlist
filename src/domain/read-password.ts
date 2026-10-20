import { clone, findMembership } from "./access";
import { hashPassword, verifyPassword } from "./passwords";
import type { Database, Wishlist } from "./types";

/** MDP de lecture publique : plus souple que le compte (partage famille). */
export const MIN_READ_PASSWORD_LENGTH = 4;

export function hasReadPassword(list: Wishlist): boolean {
  return Boolean(list.readPasswordHash);
}

export function readPasswordPolicyError(password: string): string | null {
  if (!password) return "passwordRequired";
  if (password.length < MIN_READ_PASSWORD_LENGTH) return "readPasswordTooShort";
  return null;
}

export function setReadPassword(
  doc: Database,
  input: { wishlistId: string; actorId: string; password: string },
): { ok: true; doc: Database } | { ok: false; error: string } {
  if (!findMembership(doc, input.wishlistId, input.actorId)) {
    return { ok: false, error: "notMember" };
  }
  const policy = readPasswordPolicyError(input.password);
  if (policy) return { ok: false, error: policy };
  const next = clone(doc);
  const list = next.wishlists.find((entry) => entry.id === input.wishlistId);
  if (!list) return { ok: false, error: "listMissing" };
  list.readPasswordHash = hashPassword(input.password);
  return { ok: true, doc: next };
}

export function clearReadPassword(
  doc: Database,
  input: { wishlistId: string; actorId: string },
): { ok: true; doc: Database } | { ok: false; error: string } {
  if (!findMembership(doc, input.wishlistId, input.actorId)) {
    return { ok: false, error: "notMember" };
  }
  const next = clone(doc);
  const list = next.wishlists.find((entry) => entry.id === input.wishlistId);
  if (!list) return { ok: false, error: "listMissing" };
  list.readPasswordHash = null;
  return { ok: true, doc: next };
}

export function verifyReadPassword(list: Wishlist, password: string): boolean {
  if (!list.readPasswordHash) return true;
  return verifyPassword(password, list.readPasswordHash);
}
