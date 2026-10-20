import { clone, findMembership } from "./access";
import { newToken } from "./tokens";
import type { Database } from "./types";

function wipeWishlist(doc: Database, wishlistId: string): void {
  doc.wishlists = doc.wishlists.filter((w) => w.id !== wishlistId);
  doc.memberships = doc.memberships.filter((m) => m.wishlistId !== wishlistId);
  doc.types = doc.types.filter((t) => t.wishlistId !== wishlistId);
  doc.people = doc.people.filter((p) => p.wishlistId !== wishlistId);
  doc.views = doc.views.filter((v) => v.wishlistId !== wishlistId);
  doc.items = doc.items.filter((i) => i.wishlistId !== wishlistId);
  doc.reservations = doc.reservations.filter((r) => r.wishlistId !== wishlistId);
}

export function acceptInvite(
  doc: Database,
  input: { token: string; userId: string; now?: Date },
): { ok: true; doc: Database; wishlistId: string } | { ok: false; error: string } {
  const wishlist = doc.wishlists.find((w) => w.inviteToken === input.token);
  if (!wishlist) return { ok: false, error: "inviteLinkBroken" };
  if (!doc.users.some((u) => u.id === input.userId)) {
    return { ok: false, error: "loginToJoin" };
  }
  if (findMembership(doc, wishlist.id, input.userId)) {
    return { ok: true, doc, wishlistId: wishlist.id };
  }
  const next = clone(doc);
  next.memberships.push({
    wishlistId: wishlist.id,
    userId: input.userId,
    role: "member",
    joinedAt: (input.now ?? new Date()).toISOString(),
  });
  return { ok: true, doc: next, wishlistId: wishlist.id };
}

export function regenerateInvite(
  doc: Database,
  input: { wishlistId: string; actorId: string },
): { ok: true; doc: Database; inviteToken: string } | { ok: false; error: string } {
  const actor = findMembership(doc, input.wishlistId, input.actorId);
  if (!actor || actor.role !== "owner") {
    return { ok: false, error: "ownerRegenerateInvite" };
  }
  const wishlist = doc.wishlists.find((w) => w.id === input.wishlistId);
  if (!wishlist) return { ok: false, error: "listMissing" };
  let inviteToken = newToken();
  while (inviteToken === wishlist.readToken) inviteToken = newToken();
  const next = clone(doc);
  const target = next.wishlists.find((w) => w.id === input.wishlistId)!;
  target.inviteToken = inviteToken;
  return { ok: true, doc: next, inviteToken };
}

export function removeMember(
  doc: Database,
  input: { wishlistId: string; actorId: string; userId: string },
): { ok: true; doc: Database } | { ok: false; error: string } {
  const actor = findMembership(doc, input.wishlistId, input.actorId);
  if (!actor || actor.role !== "owner") {
    return { ok: false, error: "ownerRemoveMember" };
  }
  if (input.userId === input.actorId) {
    return { ok: false, error: "useLeaveInstead" };
  }
  const target = findMembership(doc, input.wishlistId, input.userId);
  if (!target) return { ok: false, error: "personNotMember" };
  if (target.role === "owner") {
    return { ok: false, error: "ownerCannotSelfRemove" };
  }
  const next = clone(doc);
  next.memberships = next.memberships.filter(
    (m) => !(m.wishlistId === input.wishlistId && m.userId === input.userId),
  );
  return { ok: true, doc: next };
}

export function leaveWishlist(
  doc: Database,
  input: { wishlistId: string; actorId: string },
): { ok: true; doc: Database } | { ok: false; error: string } {
  const actor = findMembership(doc, input.wishlistId, input.actorId);
  if (!actor) return { ok: false, error: "notMember" };
  const others = doc.memberships
    .filter((m) => m.wishlistId === input.wishlistId && m.userId !== input.actorId)
    .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt) || a.userId.localeCompare(b.userId));
  if (others.length === 0) {
    return { ok: false, error: "aloneMustDelete" };
  }
  const next = clone(doc);
  if (actor.role === "owner") {
    const heir = next.memberships.find(
      (m) => m.wishlistId === input.wishlistId && m.userId === others[0].userId,
    )!;
    heir.role = "owner";
  }
  next.memberships = next.memberships.filter(
    (m) => !(m.wishlistId === input.wishlistId && m.userId === input.actorId),
  );
  return { ok: true, doc: next };
}

export function deleteWishlist(
  doc: Database,
  input: { wishlistId: string; actorId: string },
): { ok: true; doc: Database } | { ok: false; error: string } {
  const actor = findMembership(doc, input.wishlistId, input.actorId);
  if (!actor || actor.role !== "owner") {
    return { ok: false, error: "ownerDeleteList" };
  }
  const next = clone(doc);
  wipeWishlist(next, input.wishlistId);
  return { ok: true, doc: next };
}
