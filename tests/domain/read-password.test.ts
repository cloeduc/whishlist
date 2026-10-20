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

test("sans mot de passe : hasReadPassword false, verify toujours ok", () => {
  const list = doc().wishlists[0]!;
  assert.equal(hasReadPassword(list), false);
  assert.equal(verifyReadPassword(list, ""), true);
  assert.equal(verifyReadPassword(list, "anything"), true);
});

test("set / verify / clear", () => {
  const set = setReadPassword(doc(), { wishlistId: "w", actorId: "owner", password: "famille" });
  assert.equal(set.ok, true);
  if (!set.ok) return;
  const list = set.doc.wishlists[0]!;
  assert.equal(hasReadPassword(list), true);
  assert.ok(list.readPasswordHash);
  assert.notEqual(list.readPasswordHash, "famille");
  assert.equal(verifyReadPassword(list, "famille"), true);
  assert.equal(verifyReadPassword(list, "wrong"), false);

  const cleared = clearReadPassword(set.doc, { wishlistId: "w", actorId: "owner" });
  assert.equal(cleared.ok, true);
  if (!cleared.ok) return;
  assert.equal(cleared.doc.wishlists[0]?.readPasswordHash, null);
  assert.equal(hasReadPassword(cleared.doc.wishlists[0]!), false);
});

test("politique : trop court / non-membre", () => {
  const short = setReadPassword(doc(), { wishlistId: "w", actorId: "owner", password: "abc" });
  assert.deepEqual(short, { ok: false, error: "readPasswordTooShort" });

  const empty = setReadPassword(doc(), { wishlistId: "w", actorId: "owner", password: "" });
  assert.deepEqual(empty, { ok: false, error: "passwordRequired" });

  const stranger = setReadPassword(doc(), { wishlistId: "w", actorId: "ghost", password: "famille" });
  assert.deepEqual(stranger, { ok: false, error: "notMember" });
});
