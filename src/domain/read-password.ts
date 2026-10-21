import { clone, findMembership } from "./access";
import { hashPassword, verifyPassword } from "./passwords";
import type { Database, Wishlist } from "./types";

/** Mot de passe de lecture : réservé au propriétaire, plus court que le compte. */
export const MIN_READ_PASSWORD_LENGTH = 8;

export function hasReadPassword(list: Wishlist): boolean {
  return Boolean(list.readPasswordHash);
}

export function readPasswordPolicyError(password: string): string | null {
  if (!password) return "passwordRequired";
  if (password.length < MIN_READ_PASSWORD_LENGTH) return "readPasswordTooShort";
  return null;
}

export async function setReadPassword(
  doc: Database,
  input: { wishlistId: string; actorId: string; password: string },
): Promise<{ ok: true; doc: Database } | { ok: false; error: string }> {
  const actor = findMembership(doc, input.wishlistId, input.actorId);
  if (!actor) return { ok: false, error: "notMember" };
  if (actor.role !== "owner") return { ok: false, error: "ownerSetReadPassword" };
  const policy = readPasswordPolicyError(input.password);
  if (policy) return { ok: false, error: policy };
  const next = clone(doc);
  const list = next.wishlists.find((entry) => entry.id === input.wishlistId);
  if (!list) return { ok: false, error: "listMissing" };
  list.readPasswordHash = await hashPassword(input.password);
  return { ok: true, doc: next };
}

export function clearReadPassword(
  doc: Database,
  input: { wishlistId: string; actorId: string },
): { ok: true; doc: Database } | { ok: false; error: string } {
  const actor = findMembership(doc, input.wishlistId, input.actorId);
  if (!actor) return { ok: false, error: "notMember" };
  if (actor.role !== "owner") return { ok: false, error: "ownerSetReadPassword" };
  const next = clone(doc);
  const list = next.wishlists.find((entry) => entry.id === input.wishlistId);
  if (!list) return { ok: false, error: "listMissing" };
  list.readPasswordHash = null;
  return { ok: true, doc: next };
}

export async function verifyReadPassword(list: Wishlist, password: string): Promise<boolean> {
  if (!list.readPasswordHash) return true;
  return verifyPassword(password, list.readPasswordHash);
}
