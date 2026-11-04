import assert from "node:assert/strict";
import { test } from "node:test";
import { deleteAccount, previewAccountDeletion } from "../../src/domain/account";
import type { Database } from "../../src/domain/types";
import { accountDoc } from "./helpers/account-fixtures";

function deleted(doc: Database = accountDoc(), userId = "lou"): Database {
  const result = deleteAccount(doc, { userId });
  assert.ok(result.ok);
  return result.doc;
}

function owners(doc: Database, wishlistId: string): string[] {
  return doc.memberships.filter((m) => m.wishlistId === wishlistId && m.role === "owner").map((m) => m.userId);
}

test("a list whose only member is the deleted account disappears with all its content", () => {
  const doc = deleted();
  assert.equal(doc.wishlists.some((w) => w.id === "solo"), false);
  for (const key of ["memberships", "subscriptions", "types", "people", "views", "items", "reservations"] as const) {
    assert.equal(
      (doc[key] as { wishlistId: string }[]).some((entry) => entry.wishlistId === "solo"),
      false,
      key,
    );
  }
});

test("a shared list the account owns passes to the oldest member", () => {
  const doc = deleted();
  assert.ok(doc.wishlists.some((w) => w.id === "shared"));
  assert.deepEqual(owners(doc, "shared"), ["alex"]);
  assert.equal(doc.memberships.find((m) => m.wishlistId === "shared" && m.userId === "camille")?.role, "member");
});

test("with equal join dates, the heir is chosen by its identifier", () => {
  const doc = accountDoc();
  for (const m of doc.memberships) {
    if (m.wishlistId === "shared" && m.userId !== "lou") m.joinedAt = "2026-02-01T00:00:00.000Z";
  }
  assert.deepEqual(owners(deleted(doc), "shared"), ["alex"]);
});

test("a shared list the account is a member of only loses its membership", () => {
  const doc = deleted();
  assert.deepEqual(
    doc.memberships.filter((m) => m.wishlistId === "alexs").map((m) => [m.userId, m.role]),
    [["alex", "owner"]],
  );
});

test("the account's reservations on remaining lists are kept, unlinked from the account", () => {
  const doc = deleted();
  for (const id of ["r-alexs", "r-other"]) {
    const reservation = doc.reservations.find((r) => r.id === id);
    assert.ok(reservation, id);
    assert.equal(reservation.userId, null);
    assert.equal(reservation.fromName, "Lou");
  }
  assert.equal(doc.reservations.find((r) => r.id === "r-alexs")?.note, "Avec Camille");
  assert.equal(doc.reservations.find((r) => r.id === "r-shared")?.userId, "camille");
});

test("the account's sessions and reset links disappear, not those of others", () => {
  const doc = deleted();
  assert.deepEqual(doc.apiSessions.map((s) => s.userId), ["alex"]);
  assert.deepEqual(doc.passwordResets.map((r) => r.userId), ["alex"]);
});

test("nothing references the account any more, and each remaining list has a single owner", () => {
  const doc = deleted();
  assert.equal(doc.users.some((u) => u.id === "lou"), false);
  assert.equal(JSON.stringify(doc).includes('"lou"'), false);
  for (const wishlist of doc.wishlists) {
    assert.equal(owners(doc, wishlist.id).length, 1, wishlist.id);
  }
  assert.deepEqual(doc.wishlists.map((w) => w.id), ["shared", "alexs", "other"]);
});

test("the input document is not modified", () => {
  const doc = accountDoc();
  const before = JSON.stringify(doc);
  deleted(doc);
  assert.equal(JSON.stringify(doc), before);
});

test("a missing account: accountMissing", () => {
  const doc = accountDoc();
  assert.deepEqual(deleteAccount(doc, { userId: "ghost" }), { ok: false, error: "accountMissing" });
});

test("the preview announces what the deletion does", () => {
  const doc = accountDoc();
  assert.deepEqual(previewAccountDeletion(doc, "lou"), {
    deletedLists: [{ id: "solo", title: "Anniversaire Lou" }],
    transferredLists: [
      { id: "shared", title: "Noël en famille", newOwnerName: "Alex" },
      { id: "alexs", title: "Envies d'Alex", newOwnerName: null },
    ],
    reservationsKept: 2,
    // Only lists followed without being a member are announced.
    followedLists: [{ id: "other", title: "Liste de Camille" }],
  });
  const after = deleted(doc);
  assert.equal(after.reservations.filter((r) => ["r-alexs", "r-other"].includes(r.id)).length, 2);
});

test("the preview does not count a reservation on a list that will be erased", () => {
  const doc = accountDoc();
  doc.reservations.push({
    id: "r-own",
    wishlistId: "solo",
    itemId: "solo-item",
    fromName: "Lou",
    note: null,
    userId: "lou",
    createdAt: "2026-04-05T00:00:00.000Z",
  });
  assert.equal(previewAccountDeletion(doc, "lou").reservationsKept, 2);
});

test("the account's email confirmation requests disappear with it", () => {
  const doc = accountDoc();
  for (const purpose of ["verify", "change"] as const) {
    doc.emailConfirmations.push({
      id: `ec-${purpose}`,
      userId: "lou",
      purpose,
      email: purpose === "verify" ? "lou@example.test" : "lou.b@example.test",
      tokenHash: `h-${purpose}`,
      expiresAt: "2026-01-02T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  }
  assert.deepEqual(deleted(doc).emailConfirmations, []);
});
