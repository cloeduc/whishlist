import assert from "node:assert/strict";
import { test } from "node:test";
import { createItem } from "../../src/domain/items";
import { createWishlist } from "../../src/domain/import";
import {
  acceptInvite,
  leaveWishlist,
  regenerateInvite,
  removeMember,
} from "../../src/domain/membership";
import { emptyDatabase, type Database } from "../../src/domain/types";

function base(): Database {
  const doc = emptyDatabase();
  doc.users.push(
    {
      id: "a",
      email: "a@b.c",
      passwordHash: "x",
      displayName: "A",
      createdAt: "2026-01-01T00:00:00.000Z",
      mustChangePassword: false,
    },
    {
      id: "b",
      email: "b@b.c",
      passwordHash: "x",
      displayName: "B",
      createdAt: "2026-01-01T00:00:00.000Z",
      mustChangePassword: false,
    },
  );
  const created = createWishlist(doc, { ownerId: "a", title: "Commune", importTemplate: false, id: "w" });
  if (!created.ok) throw new Error(created.error);
  return created.doc;
}

test("invitation, membres, départ du créateur", () => {
  const doc = base();
  const list = doc.wishlists[0]!;
  assert.notEqual(list.readToken, list.inviteToken);
  const anon = acceptInvite(doc, { token: list.inviteToken, userId: "ghost" });
  assert.equal(anon.ok, false);
  const joined = acceptInvite(doc, { token: list.inviteToken, userId: "b", now: new Date("2026-02-01") });
  assert.equal(joined.ok, true);
  if (!joined.ok) return;
  const again = acceptInvite(joined.doc, { token: list.inviteToken, userId: "b" });
  assert.equal(again.ok, true);
  if (!again.ok) return;
  assert.equal(again.doc.memberships.filter((m) => m.userId === "b").length, 1);
  const rotated = regenerateInvite(joined.doc, { wishlistId: "w", actorId: "a" });
  assert.equal(rotated.ok, true);
  if (!rotated.ok) return;
  assert.notEqual(rotated.inviteToken, list.inviteToken);
  const stale = acceptInvite(rotated.doc, { token: list.inviteToken, userId: "a" });
  assert.equal(stale.ok, false);
  const removed = removeMember(rotated.doc, { wishlistId: "w", actorId: "a", userId: "b" });
  assert.equal(removed.ok, true);
  if (!removed.ok) return;
  assert.equal(removed.doc.wishlists[0]?.readToken, list.readToken);
  assert.equal(removed.doc.memberships.some((m) => m.userId === "b"), false);
  const rejoined = acceptInvite(removed.doc, { token: rotated.inviteToken, userId: "b" });
  assert.equal(rejoined.ok, true);
  if (!rejoined.ok) return;
  const left = leaveWishlist(rejoined.doc, { wishlistId: "w", actorId: "a" });
  assert.equal(left.ok, true);
  if (!left.ok) return;
  const owner = left.doc.memberships.find((m) => m.wishlistId === "w" && m.role === "owner");
  assert.equal(owner?.userId, "b");
  const alone = leaveWishlist(left.doc, { wishlistId: "w", actorId: "b" });
  assert.equal(alone.ok, false);
  const outsider = createItem(rejoined.doc, {
    wishlistId: "w",
    actorId: "nobody",
    name: "x",
    typeId: "missing",
    personId: "missing",
  });
  assert.equal(outsider.ok, false);
});
