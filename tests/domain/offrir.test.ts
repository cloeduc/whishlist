import assert from "node:assert/strict";
import { test } from "node:test";
import { listOffrir } from "../../src/domain/offrir";
import { emptyDatabase } from "../../src/domain/types";

test("offrir scopé à la liste, champs vides, zéro ligne", () => {
  const doc = emptyDatabase();
  doc.types.push({ id: "t", wishlistId: "w", label: "Jeux" });
  doc.items.push({
    id: "gang",
    wishlistId: "w",
    name: "The Gang",
    typeId: "t",
    url: null,
    imageUrl: null,
    priceCents: 1800,
    priority: null,
    personId: "p",
    sortOrder: 1,
    archived: false,
  });
  assert.equal(listOffrir(doc, "w").length, 0);
  doc.reservations.push(
    {
      id: "r1",
      wishlistId: "w",
      itemId: "gang",
      fromName: null,
      note: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "r2",
      wishlistId: "other",
      itemId: "gang",
      fromName: "Sam",
      note: "mot",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  );
  const rows = listOffrir(doc, "w");
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.itemName, "The Gang");
  assert.equal(rows[0]?.typeLabel, "Jeux");
  assert.equal(rows[0]?.fromName, null);
  assert.equal(rows[0]?.note, null);
});
