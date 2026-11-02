import assert from "node:assert/strict";
import { test } from "node:test";
import { acceptInvite, deleteWishlist } from "../../src/domain/membership";
import {
  extractReadToken,
  findSubscription,
  isSubscriptionUnlocked,
  subscribeWishlist,
  syncSubscriptionUnlock,
  unsubscribeWishlist,
} from "../../src/domain/subscription";
import { accountDoc } from "./helpers/account-fixtures";

test("extractReadToken accepte un jeton brut, un chemin /l/ ou /en/l/, et une URL complète", () => {
  assert.equal(extractReadToken("read-other-123456"), "read-other-123456");
  assert.equal(extractReadToken("  read-other-123456  "), "read-other-123456");
  assert.equal(extractReadToken("/l/read-other-123456"), "read-other-123456");
  assert.equal(extractReadToken("/en/l/read-other-123456/"), "read-other-123456");
  assert.equal(extractReadToken("/fr/l/read-other-123456?qui=p1#cat"), "read-other-123456");
  assert.equal(
    extractReadToken("https://ohyoushouldnt.app/en/l/read-other-123456?budget=20-50#c"),
    "read-other-123456",
  );
  assert.equal(extractReadToken(""), null);
  assert.equal(extractReadToken("   "), null);
  assert.equal(extractReadToken("court"), null);
  assert.equal(extractReadToken("https://ohyoushouldnt.app/inviter/invite-token-123"), null);
  assert.equal(extractReadToken("https://ohyoushouldnt.app/listes/12345678"), null);
  assert.equal(extractReadToken("http://[invalid"), null);
});

test("subscribeWishlist crée un abonnement et reste idempotent", () => {
  const doc = accountDoc();
  const now = new Date("2026-11-02T10:00:00.000Z");
  const created = subscribeWishlist(doc, { wishlistId: "other", userId: "alex", now });
  assert.ok(created.ok);
  assert.equal(created.replayed, false);
  assert.deepEqual(created.subscription, {
    wishlistId: "other",
    userId: "alex",
    readPasswordHash: null,
    createdAt: "2026-11-02T10:00:00.000Z",
  });

  const again = subscribeWishlist(created.doc, { wishlistId: "other", userId: "alex" });
  assert.ok(again.ok);
  assert.equal(again.replayed, true);
  assert.equal(
    again.doc.subscriptions.filter((s) => s.wishlistId === "other" && s.userId === "alex").length,
    1,
  );
});

test("subscribeWishlist refuse alreadyMember, listMissing et accountMissing", () => {
  const doc = accountDoc();
  assert.deepEqual(subscribeWishlist(doc, { wishlistId: "shared", userId: "lou" }), {
    ok: false,
    error: "alreadyMember",
  });
  assert.deepEqual(subscribeWishlist(doc, { wishlistId: "shared", userId: "alex" }), {
    ok: false,
    error: "alreadyMember",
  });
  assert.deepEqual(subscribeWishlist(doc, { wishlistId: "unknown", userId: "lou" }), {
    ok: false,
    error: "listMissing",
  });
  assert.deepEqual(subscribeWishlist(doc, { wishlistId: "other", userId: "ghost" }), {
    ok: false,
    error: "accountMissing",
  });
});

test("isSubscriptionUnlocked et syncSubscriptionUnlock suivent le mot de passe de lecture", () => {
  const doc = accountDoc();
  const sub = subscribeWishlist(doc, { wishlistId: "alexs", userId: "camille" });
  assert.ok(sub.ok);
  const list = sub.doc.wishlists.find((w) => w.id === "alexs")!;
  assert.equal(isSubscriptionUnlocked(list, sub.subscription), true);

  // Si le propriétaire change le mot de passe de lecture, l'abonnement devient verrouillé.
  list.readPasswordHash = "scrypt$new-secret";
  assert.equal(isSubscriptionUnlocked(list, sub.subscription), false);

  // Après déverrouillage, syncSubscriptionUnlock met à jour l'empreinte.
  const synced = syncSubscriptionUnlock(sub.doc, { wishlistId: "alexs", userId: "camille" });
  const updatedSub = findSubscription(synced, "alexs", "camille")!;
  assert.equal(isSubscriptionUnlocked(list, updatedSub), true);
});

test("unsubscribeWishlist retire l'abonnement sans toucher aux réservations", () => {
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

test("acceptInvite retire automatiquement l'abonnement existant du nouveau membre", () => {
  const doc = accountDoc();
  assert.ok(findSubscription(doc, "other", "lou"));
  const joined = acceptInvite(doc, { token: "invite-other", userId: "lou" });
  assert.ok(joined.ok);
  assert.equal(findSubscription(joined.doc, "other", "lou"), null);
});

test("deleteWishlist supprime les abonnements de la liste", () => {
  const doc = accountDoc();
  assert.ok(findSubscription(doc, "solo", "camille"));
  const res = deleteWishlist(doc, { wishlistId: "solo", actorId: "lou" });
  assert.ok(res.ok);
  assert.equal(findSubscription(res.doc, "solo", "camille"), null);
});
