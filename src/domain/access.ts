import type { Database, Membership } from "./types";

export function findMembership(
  doc: Database,
  wishlistId: string,
  userId: string,
): Membership | null {
  return (
    doc.memberships.find((m) => m.wishlistId === wishlistId && m.userId === userId) ??
    null
  );
}

export function clone(doc: Database): Database {
  return structuredClone(doc);
}
