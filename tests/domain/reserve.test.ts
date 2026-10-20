import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { availableItems, reserveItem } from "../../src/domain/reserve";
import { emptyDatabase, type Database } from "../../src/domain/types";
import { readDocument, updateDocument } from "../../src/store/db";

function doc(): Database {
  const data = emptyDatabase();
  data.wishlists.push({
    id: "w",
    title: "L",
    subtitle: null,
    coverImageUrl: null,
    theme: { primary: "#1e60ff", accent: "#ff2d2d", highlight: "#ffd700", background: "#e8f0ff" },
    readToken: "r",
    inviteToken: "i",
    readPasswordHash: null,
    fromTemplate: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  });
  data.types.push(
    { id: "jeux", wishlistId: "w", label: "Jeux" },
    { id: "livres", wishlistId: "w", label: "Livres" },
  );
  data.people.push({ id: "p", wishlistId: "w", label: "Couple" });
  data.items.push(
    {
      id: "gang",
      wishlistId: "w",
      name: "The Gang",
      typeId: "jeux",
      url: null,
      imageUrl: null,
      priceCents: 1800,
      priority: null,
      personId: "p",
      sortOrder: 1,
      archived: false,
    },
    {
      id: "book",
      wishlistId: "w",
      name: "Livre",
      typeId: "livres",
      url: null,
      imageUrl: null,
      priceCents: null,
      priority: null,
      personId: "p",
      sortOrder: 2,
      archived: false,
    },
  );
  return data;
}

test("réservation, blank, type, champs vides", () => {
  const data = doc();
  assert.equal(availableItems(data, "w", "").length, 2);
  assert.equal(availableItems(data, "w", "jeux").length, 1);
  const missing = reserveItem(data, { wishlistId: "w", itemId: "" });
  assert.equal(missing.ok, false);
  const first = reserveItem(data, {
    wishlistId: "w",
    itemId: "gang",
    fromName: "  ",
    note: "",
    userId: "u1",
  });
  assert.equal(first.ok, true);
  if (!first.ok) return;
  assert.equal(first.reservation.fromName, null);
  assert.equal(first.reservation.note, null);
  assert.equal(first.reservation.userId, "u1");
  const anon = reserveItem(data, { wishlistId: "w", itemId: "book" });
  assert.equal(anon.ok, true);
  if (anon.ok) assert.equal(anon.reservation.userId, null);
  assert.equal(first.doc.items.find((item) => item.id === "gang")?.archived, true);
  assert.equal(availableItems(first.doc, "w", "").length, 1);
  const second = reserveItem(first.doc, { wishlistId: "w", itemId: "gang", fromName: "Sam" });
  assert.equal(second.ok, false);
  assert.equal(first.doc.reservations.length, 1);
  const wrongType = reserveItem(data, { wishlistId: "w", itemId: "book", typeId: "jeux" });
  assert.equal(wrongType.ok, false);
});

test("deux confirmations simultanées sous lock", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "wl-res-"));
  process.env.WISHLIST_DATA_PATH = path.join(dir, "wishlist.json");
  try {
    await updateDocument((current) => ({ doc: doc(), result: current }));
    await Promise.all([
      updateDocument((current) => {
        const result = reserveItem(current, { wishlistId: "w", itemId: "gang", fromName: "A" });
        return { doc: result.ok ? result.doc : current, result };
      }),
      updateDocument((current) => {
        const result = reserveItem(current, { wishlistId: "w", itemId: "gang", fromName: "B" });
        return { doc: result.ok ? result.doc : current, result };
      }),
    ]);
    const saved = await readDocument();
    assert.equal(saved.reservations.length, 1);
  } finally {
    delete process.env.WISHLIST_DATA_PATH;
    await rm(dir, { recursive: true, force: true });
  }
});
