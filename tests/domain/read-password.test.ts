import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clearReadPassword,
  hasReadPassword,
  setReadPassword,
  verifyReadPassword,
} from "../../src/domain/read-password";
import { DEFAULT_WISHLIST_THEME } from "../../src/domain/theme";
import { emptyDatabase, type Database } from "../../src/domain/types";

function doc(): Database {
  const data = emptyDatabase();
  data.wishlists.push({
    id: "w",
    title: "Liste",
    subtitle: null,
    coverImageUrl: null,
    theme: { ...DEFAULT_WISHLIST_THEME },
    readToken: "read",
    inviteToken: "invite",
    readPasswordHash: null,
    fromTemplate: false,
    createdAt: "2026-01-01T00:00:00.000Z",
  });
  data.memberships.push({
    wishlistId: "w",
    userId: "owner",
    role: "owner",
    joinedAt: "2026-01-01T00:00:00.000Z",
  });
  return data;
}

test("sans mot de passe : hasReadPassword false, verify toujours ok", async () => {
  const list = doc().wishlists[0]!;
  assert.equal(hasReadPassword(list), false);
  assert.equal(await verifyReadPassword(list, ""), true);
  assert.equal(await verifyReadPassword(list, "anything"), true);
});

test("set / verify / clear", async () => {
  const set = await setReadPassword(doc(), { wishlistId: "w", actorId: "owner", password: "famille1" });
  assert.equal(set.ok, true);
  if (!set.ok) return;
  const list = set.doc.wishlists[0]!;
  assert.equal(hasReadPassword(list), true);
  assert.ok(list.readPasswordHash);
  assert.notEqual(list.readPasswordHash, "famille1");
  assert.equal(await verifyReadPassword(list, "famille1"), true);
  assert.equal(await verifyReadPassword(list, "wrong"), false);

  const cleared = clearReadPassword(set.doc, { wishlistId: "w", actorId: "owner" });
  assert.equal(cleared.ok, true);
  if (!cleared.ok) return;
  assert.equal(cleared.doc.wishlists[0]?.readPasswordHash, null);
  assert.equal(hasReadPassword(cleared.doc.wishlists[0]!), false);
});

test("politique : trop court / non-membre", async () => {
  const short = await setReadPassword(doc(), { wishlistId: "w", actorId: "owner", password: "abc" });
  assert.deepEqual(short, { ok: false, error: "readPasswordTooShort" });

  const empty = await setReadPassword(doc(), { wishlistId: "w", actorId: "owner", password: "" });
  assert.deepEqual(empty, { ok: false, error: "passwordRequired" });

  const stranger = await setReadPassword(doc(), { wishlistId: "w", actorId: "ghost", password: "famille1" });
  assert.deepEqual(stranger, { ok: false, error: "notMember" });

  const withMember = doc();
  withMember.memberships.push({
    wishlistId: "w",
    userId: "member",
    role: "member",
    joinedAt: "2026-01-02T00:00:00.000Z",
  });
  const member = await setReadPassword(withMember, {
    wishlistId: "w",
    actorId: "member",
    password: "famille1",
  });
  assert.deepEqual(member, { ok: false, error: "ownerSetReadPassword" });
  const cleared = clearReadPassword(withMember, { wishlistId: "w", actorId: "member" });
  assert.deepEqual(cleared, { ok: false, error: "ownerSetReadPassword" });
});
