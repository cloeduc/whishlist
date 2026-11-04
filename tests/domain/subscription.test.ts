import assert from "node:assert/strict";
import { test } from "node:test";
import { acceptInvite, deleteWishlist } from "../../src/domain/membership";
import { extractReadToken } from "../../src/domain/read-link";
import {
  findSubscription,
  followedListsOf,
  isSubscriptionUnlocked,
  subscribeWishlist,
  syncSubscriptionUnlock,
  unsubscribeWishlist,
  viewerRelation,
} from "../../src/domain/subscription";
import { accountDoc } from "./helpers/account-fixtures";

test("extractReadToken accepts a raw token, a /l/ or /en/l/ path, and a full URL", () => {
  assert.equal(extractReadToken("read-other-123456"), "read-other-123456");
  assert.equal(extractReadToken("  read-other-123456  "), "read-other-123456");
  assert.equal(extractReadToken("/l/read-other-123456"), "read-other-123456");
  assert.equal(extractReadToken("/en/l/read-other-123456/"), "read-other-123456");
  assert.equal(extractReadToken("/fr/l/read-other-123456?qui=p1#cat"), "read-other-123456");
  assert.equal(
    extractReadToken("https://ohyoushouldnt.app/en/l/read-other-123456?budget=20-50#c"),
    "read-other-123456",
  );
  assert.equal(extractReadToken("HTTPS://ohyoushouldnt.app/l/read-other-123456"), "read-other-123456");
  assert.equal(extractReadToken("ohyoushouldnt.app/en/l/read-other-123456"), "read-other-123456");
  assert.equal(extractReadToken("localhost:3000/l/read-other-123456"), "read-other-123456");
  assert.equal(extractReadToken("ohyoushouldnt://l/read-other-123456"), "read-other-123456");
  assert.equal(
    extractReadToken("https://ohyoushouldnt.app/l/read-other-123456/reserver?itemId=i1"),
    "read-other-123456",
  );
  assert.equal(extractReadToken("/l/read-other-123456/types"), "read-other-123456");
  assert.equal(extractReadToken("ohyoushouldnt.app/listes/read-other-123456"), null);
  assert.equal(extractReadToken(""), null);
  assert.equal(extractReadToken("   "), null);
  assert.equal(extractReadToken("court"), null);
  assert.equal(extractReadToken("https://ohyoushouldnt.app/inviter/invite-token-123"), null);
  assert.equal(extractReadToken("https://ohyoushouldnt.app/listes/12345678"), null);
  assert.equal(extractReadToken("http://[invalid"), null);
});

test("subscribeWishlist creates a subscription and stays idempotent", () => {
  const doc = accountDoc();
  const now = new Date("2026-11-02T10:00:00.000Z");
  const created = subscribeWishlist(doc, { wishlistId: "other", userId: "alex", verifiedHash: null, now });
  assert.ok(created.ok);
  assert.equal(created.replayed, false);
  assert.deepEqual(created.subscription, {
    wishlistId: "other",
    userId: "alex",
    readPasswordHash: null,
    createdAt: "2026-11-02T10:00:00.000Z",
  });

  const again = subscribeWishlist(created.doc, { wishlistId: "other", userId: "alex", verifiedHash: null });
  assert.ok(again.ok);
  assert.equal(again.replayed, true);
  assert.equal(
    again.doc.subscriptions.filter((s) => s.wishlistId === "other" && s.userId === "alex").length,
    1,
  );
});

test("subscribeWishlist refuses alreadyMember, listMissing and accountMissing", () => {
  const doc = accountDoc();
  assert.deepEqual(subscribeWishlist(doc, { wishlistId: "shared", userId: "lou", verifiedHash: null }), {
    ok: false,
    error: "alreadyMember",
  });
  assert.deepEqual(subscribeWishlist(doc, { wishlistId: "shared", userId: "alex", verifiedHash: null }), {
    ok: false,
    error: "alreadyMember",
  });
  assert.deepEqual(subscribeWishlist(doc, { wishlistId: "unknown", userId: "lou", verifiedHash: null }), {
    ok: false,
    error: "listMissing",
  });
  assert.deepEqual(subscribeWishlist(doc, { wishlistId: "other", userId: "ghost", verifiedHash: null }), {
    ok: false,
    error: "accountMissing",
  });
});

test("subscribeWishlist refuses a fingerprint that is no longer the list's", () => {
  const doc = accountDoc();
  // Access verified against the old password, changed by the owner during the check.
  assert.deepEqual(
    subscribeWishlist(doc, { wishlistId: "alexs", userId: "camille", verifiedHash: "scrypt$old-secret" }),
    { ok: false, error: "readPasswordChanged" },
  );
  // List without a password at check time, protected since.
  assert.deepEqual(
    subscribeWishlist(doc, { wishlistId: "alexs", userId: "camille", verifiedHash: null }),
    { ok: false, error: "readPasswordChanged" },
  );
});

test("isSubscriptionUnlocked and syncSubscriptionUnlock follow the read password", () => {
  const doc = accountDoc();
  const sub = subscribeWishlist(doc, { wishlistId: "alexs", userId: "camille", verifiedHash: "scrypt$read-secret" });
  assert.ok(sub.ok);
  const list = sub.doc.wishlists.find((w) => w.id === "alexs")!;
  assert.equal(isSubscriptionUnlocked(list, sub.subscription), true);

  // If the owner changes the read password, the subscription becomes locked.
  list.readPasswordHash = "scrypt$new-secret";
  assert.equal(isSubscriptionUnlocked(list, sub.subscription), false);

  // An unlock verified against the old hash updates nothing.
  const stale = syncSubscriptionUnlock(sub.doc, {
    wishlistId: "alexs",
    userId: "camille",
    verifiedHash: "scrypt$read-secret",
  });
  assert.equal(isSubscriptionUnlocked(list, findSubscription(stale, "alexs", "camille")!), false);

  // After unlocking with the new password, syncSubscriptionUnlock updates the hash.
  const synced = syncSubscriptionUnlock(sub.doc, {
    wishlistId: "alexs",
    userId: "camille",
    verifiedHash: "scrypt$new-secret",
  });
  const updatedSub = findSubscription(synced, "alexs", "camille")!;
  assert.equal(isSubscriptionUnlocked(list, updatedSub), true);
});

test("unsubscribeWishlist removes the subscription without touching reservations", () => {
  const doc = accountDoc();
  const res = unsubscribeWishlist(doc, { wishlistId: "other", userId: "lou" });
  assert.ok(res.ok);
  assert.equal(findSubscription(res.doc, "other", "lou"), null);
  assert.ok(res.doc.reservations.some((r) => r.id === "r-other" && r.userId === "lou"));
  assert.deepEqual(unsubscribeWishlist(res.doc, { wishlistId: "other", userId: "lou" }), {
    ok: false,
    error: "listMissing",
  });
});

test("acceptInvite automatically removes the new member's existing subscription", () => {
  const doc = accountDoc();
  assert.ok(findSubscription(doc, "other", "lou"));
  const joined = acceptInvite(doc, { token: "invite-other", userId: "lou" });
  assert.ok(joined.ok);
  assert.equal(findSubscription(joined.doc, "other", "lou"), null);
});

test("deleteWishlist deletes the list's subscriptions", () => {
  const doc = accountDoc();
  assert.ok(findSubscription(doc, "solo", "camille"));
  const res = deleteWishlist(doc, { wishlistId: "solo", actorId: "lou" });
  assert.ok(res.ok);
  assert.equal(findSubscription(res.doc, "solo", "camille"), null);
});

test("followedListsOf keeps only followed lists the account is not a member of", () => {
  const doc = accountDoc();
  // Lou follows "other"; we add a subscription to "solo", which they are a member of.
  doc.subscriptions.push({ wishlistId: "solo", userId: "lou", readPasswordHash: null, createdAt: "2026-04-05T00:00:00.000Z" });
  assert.deepEqual(
    followedListsOf(doc, "lou").map(({ wishlist }) => wishlist.id),
    ["other"],
  );
  // A subscription whose list is gone is ignored.
  doc.wishlists = doc.wishlists.filter((w) => w.id !== "other");
  assert.deepEqual(followedListsOf(doc, "lou"), []);
});

test("viewerRelation tells member, subscriber and visitor apart", () => {
  const doc = accountDoc();
  assert.deepEqual(viewerRelation(doc, "other", "lou"), { isMember: false, subscribed: true });
  assert.deepEqual(viewerRelation(doc, "solo", "lou"), { isMember: true, subscribed: false });
  assert.deepEqual(viewerRelation(doc, "other", "alex"), { isMember: false, subscribed: false });
  assert.deepEqual(viewerRelation(doc, "other", null), { isMember: false, subscribed: false });
});
