import assert from "node:assert/strict";
import { before, test } from "node:test";
import { splitLabels } from "../../src/domain/items";
import { manageLabel } from "../../src/server/commands/labels";
import { createList } from "../../src/server/commands/lists";
import { apiDoc, ctx, ensurePasswordHash, withStore } from "./helpers/api-fixtures";

before(ensurePasswordHash);

test("splitLabels splits, trims and deduplicates", () => {
  assert.deepEqual(splitLabels("Wilh, Nathan, Nous deux"), ["Wilh", "Nathan", "Nous deux"]);
  assert.deepEqual(splitLabels("Livres"), ["Livres"]);
  assert.deepEqual(splitLabels("A;B\nC"), ["A", "B", "C"]);
  // blanks and empty separators ignored
  assert.deepEqual(splitLabels("  A ,, , B  "), ["A", "B"]);
  // duplicates removed case-insensitively, first one kept
  assert.deepEqual(splitLabels("Nathan, nathan, NATHAN"), ["Nathan"]);
  // an empty input gives no label
  assert.deepEqual(splitLabels("   "), []);
  assert.deepEqual(splitLabels(""), []);
});

test("adding comma-separated « qui » creates several", async () => {
  const doc = apiDoc();
  const alex = ctx(doc.users[0]!);
  await withStore(doc, async () => {
    const added = await manageLabel(alex, {
      kind: "person",
      op: "add",
      wishlistId: "w",
      label: "Wilh, Nathan, Nous deux",
    });
    assert.equal(added.ok, true);
    if (!added.ok) return;
    assert.deepEqual(
      added.labels.map((entry) => entry.label),
      ["Wilh", "Nathan", "Nous deux"],
    );
    // `label` stays the first one, for callers that expect only one (API v1).
    assert.equal(added.label?.label, "Wilh");
  });
});

test("an empty input keeps the domain error", async () => {
  const doc = apiDoc();
  const alex = ctx(doc.users[0]!);
  await withStore(doc, async () => {
    assert.deepEqual(await manageLabel(alex, { kind: "person", op: "add", wishlistId: "w", label: " , , " }), {
      ok: false,
      error: "personNeedsName",
    });
    assert.deepEqual(await manageLabel(alex, { kind: "type", op: "add", wishlistId: "w", label: "" }), {
      ok: false,
      error: "typeNeedsName",
    });
  });
});

test("renaming does not split: a comma stays in the label", async () => {
  const doc = apiDoc();
  const alex = ctx(doc.users[0]!);
  await withStore(doc, async () => {
    const added = await manageLabel(alex, { kind: "person", op: "add", wishlistId: "w", label: "Wilh" });
    assert.equal(added.ok, true);
    if (!added.ok || !added.label) return;
    const renamed = await manageLabel(alex, {
      kind: "person",
      op: "rename",
      wishlistId: "w",
      id: added.label.id,
      label: "Papa, maman",
    });
    assert.equal(renamed.ok, true);
    if (!renamed.ok) return;
    assert.equal(renamed.label?.label, "Papa, maman");
  });
});

test("creating a list also splits the category and the « qui »", async () => {
  const doc = apiDoc();
  const camille = ctx(doc.users[1]!);
  await withStore(doc, async () => {
    const created = await createList(camille, {
      title: "Noël",
      category: "Livres, Jeux",
      person: "Wilh, Nathan",
    });
    assert.equal(created.ok, true);
    if (!created.ok) return;
    assert.deepEqual(
      created.list.categories.map((type) => type.label),
      ["Livres", "Jeux"],
    );
    assert.deepEqual(
      created.list.people.map((person) => person.label),
      ["Wilh", "Nathan"],
    );
  });
});
