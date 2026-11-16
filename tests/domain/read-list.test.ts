import assert from "node:assert/strict";
import { test } from "node:test";
import { emptyDatabase } from "../../src/domain/types";
import { getPublicWishlist } from "../../src/domain/read";
import { availableItems } from "../../src/domain/reserve";
import type { Database } from "../../src/domain/types";

function sample(): Database {
  const doc = emptyDatabase();
  doc.wishlists.push({
    id: "w",
    title: "Liste",
    subtitle: null,
    coverImageUrl: null,
    theme: { primary: "#1e60ff", accent: "#ff2d2d", highlight: "#ffd700", background: "#e8f0ff" },
    readToken: "read",
    inviteToken: "invite",
    readPasswordHash: null,
    fromTemplate: false,
    createdAt: "2026-01-01T00:00:00.000Z",
  });
  doc.types.push({ id: "t", wishlistId: "w", label: "Jeux", sortOrder: 0 });
  doc.people.push({ id: "p", wishlistId: "w", label: "Couple" });
  doc.items.push(
    {
      id: "b",
      wishlistId: "w",
      name: "Second",
      typeId: "t",
      url: null,
      imageUrl: null,
      priceCents: null,
      priority: null,
      secondHandOk: false,
      description: null,
      personId: "p",
      sortOrder: 2,
      archived: false,
    },
    {
      id: "a",
      wishlistId: "w",
      name: "The Gang",
      typeId: "t",
      url: "https://example.test/gang",
      imageUrl: null,
      priceCents: 1800,
      priority: null,
      secondHandOk: false,
      description: null,
      personId: "p",
      sortOrder: 1,
      archived: false,
    },
  );
  doc.reservations.push({
    id: "r",
    wishlistId: "w",
    itemId: "a",
    fromName: "Sam",
    note: "pour noël",
    userId: null,
    createdAt: "2026-01-02T00:00:00.000Z",
  });
  return doc;
}

test("unknown token", () => {
  assert.equal(getPublicWishlist(sample(), "nope"), null);
});

test("sorting, empty fields, reserved items absent, no user", () => {
  const pub = getPublicWishlist(sample(), "read");
  assert.ok(pub);
  assert.deepEqual(
    pub.items.map((item) => item.name),
    ["Second"],
  );
  assert.equal(pub.items[0]?.url, null);
  assert.equal(pub.items[0]?.priceLabel, null);
  assert.equal(pub.items[0]?.priority, null);
  assert.equal(pub.items[0]?.reserved, false);
  assert.equal("users" in pub, false);
});

test("a reserved idea that is not archived stays hidden from other guests, visible to its giver (020)", () => {
  const doc = sample();
  const reservation = doc.reservations[0]!;
  assert.equal(doc.items.find((item) => item.id === reservation.itemId)?.archived, false);
  assert.deepEqual(
    getPublicWishlist(doc, "read")?.items.map((item) => item.id),
    doc.items.filter((item) => item.id !== reservation.itemId).map((item) => item.id),
  );
  const mine = getPublicWishlist(doc, "read", "fr-FR", new Set([reservation.id]));
  assert.equal(mine?.items.find((item) => item.id === reservation.itemId)?.mine, true);
  assert.equal(
    availableItems(doc, "w", "").some((item) => item.id === reservation.itemId),
    false,
  );
});
