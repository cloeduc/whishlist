import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { importTemplate } from "../../src/domain/import";
import { emptyDatabase, type SeedFile } from "../../src/domain/types";

test("fixture démo couvre liste, archive et réservation sans données réelles", async () => {
  const seed = JSON.parse(await readFile("data/demo-seed.json", "utf8")) as SeedFile;
  assert.equal(seed.items.length, 9);
  assert.equal(seed.items.some((item) => item.archived), true);
  assert.equal(seed.items.some((item) => item.url === null), true);
  assert.equal(seed.items.some((item) => item.priceCents === null), true);
  assert.deepEqual(
    seed.people.map((person) => person.label),
    ["Alex", "Camille", "Nous deux"],
  );

  const imported = importTemplate(emptyDatabase(), "demo-list", seed);
  assert.equal(imported.items.length, 9);
  assert.equal(imported.items.every((item) => item.wishlistId === "demo-list"), true);
  assert.equal(imported.items.some((item) => item.id === "demo-list:jeu"), true);
});
