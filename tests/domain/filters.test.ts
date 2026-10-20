import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import {
  applyBudget,
  applyPerson,
  applyView,
  groupByCategory,
  parseBudget,
  sortByPriority,
} from "../../src/domain/filters";
import { createWishlist } from "../../src/domain/import";
import { emptyDatabase, type SeedFile } from "../../src/domain/types";

const seed = JSON.parse(readFileSync(path.join(process.cwd(), "data", "seed.json"), "utf8")) as SeedFile;

function doc() {
  const base = emptyDatabase();
  base.users.push({
    id: "u",
    email: "a@b.c",
    passwordHash: "x",
    displayName: "A",
    createdAt: "2026-01-01T00:00:00.000Z",
    mustChangePassword: false,
  });
  const created = createWishlist(base, {
    ownerId: "u",
    title: "Fixture",
    importTemplate: true,
    seed,
    id: "w",
  });
  if (!created.ok) throw new Error(created.error);
  return created.doc;
}

test("filtres du seed de test", () => {
  const data = doc();
  const names = (view: string) => applyView(data, "w", `w:${view}`).map((item) => item.name);
  const gaming = names("gaming");
  assert.ok(gaming.includes("Steam Deck OLED 1TB"));
  assert.ok(gaming.includes("DualSense Edge controller"));
  assert.equal(gaming.includes("Keychron Q1 Pro (wireless)"), false);
  const tech = names("tech");
  assert.ok(tech.includes("Keychron Q1 Pro (wireless)"));
  assert.ok(tech.includes("AirPods Max"));
  assert.ok(tech.includes("Samsung T7 Shield 2TB portable SSD"));
  assert.equal(tech.includes("Steam Deck OLED 1TB"), false);
  assert.equal(applyView(data, "w", "w:unknown").length, seed.items.length);
});

test("filtre par budget", () => {
  const data = doc();
  const all = applyView(data, "w", null);
  const names = (budget: Parameters<typeof applyBudget>[1]) =>
    applyBudget(all, budget).map((item) => item.name);
  const under = names("under-20");
  assert.equal(under.includes("Steam Deck OLED 1TB"), false);
  assert.equal(under.includes("Nintendo Switch 2 (when it drops)"), false);
  const mid = names("50-100");
  assert.ok(mid.includes("The Legend of Zelda: Tears of the Kingdom"));
  assert.ok(mid.includes("Anker 140W GaN charger + USB-C cable pack"));
  assert.ok(names("over-100").includes("Steam Deck OLED 1TB"));
  assert.ok(names("none").includes("Nintendo Switch 2 (when it drops)"));
  assert.equal(names("none").includes("Steam Deck OLED 1TB"), false);
  assert.equal(applyBudget(all, parseBudget("nope")).length, seed.items.length);
});

test("qui se combine avec le type", () => {
  const data = doc();
  const gaming = applyView(data, "w", "w:gaming");
  const me = applyPerson(gaming, "w:me").map((item) => item.name);
  assert.ok(me.includes("Steam Deck OLED 1TB"));
  assert.equal(me.includes("The Legend of Zelda: Tears of the Kingdom"), false);
  const shared = applyPerson(gaming, "w:shared").map((item) => item.name);
  assert.ok(shared.includes("The Legend of Zelda: Tears of the Kingdom"));
  assert.equal(shared.includes("Steam Deck OLED 1TB"), false);
  assert.equal(applyPerson(gaming, null).length, gaming.length);
});

test("tri par priorité dans une vue filtrée", () => {
  const data = doc();
  const gaming = sortByPriority(applyView(data, "w", "w:gaming"));
  assert.ok(gaming.length >= 2);
  for (let i = 1; i < gaming.length; i++) {
    const prev = Number(gaming[i - 1]?.priority ?? 0);
    const next = Number(gaming[i]?.priority ?? 0);
    assert.ok(prev >= next);
  }
});

test("groupement par catégorie alphabétique", () => {
  const data = doc();
  const items = sortByPriority(applyView(data, "w", null));
  const types = data.types.filter((type) => type.wishlistId === "w");
  const groups = groupByCategory(items, types);
  const labels = groups.map((group) => group.label);
  assert.deepEqual(
    labels,
    [...labels].sort((a, b) => a.localeCompare(b, "en")),
  );
  assert.ok(labels.includes("Gaming"));
  assert.ok(labels.includes("Tech"));
  const gaming = groups.find((group) => group.label === "Gaming");
  assert.ok(gaming);
  assert.ok(gaming.items.some((item) => item.name === "Steam Deck OLED 1TB"));
  assert.equal(
    groups.reduce((sum, group) => sum + group.items.length, 0),
    items.length,
  );
});
