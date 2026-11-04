import assert from "node:assert/strict";
import { before, test } from "node:test";
import { createWishlist } from "../../src/domain/import";
import { addPerson, addType, renamePerson, renameType } from "../../src/domain/items";
import { emptyDatabase, type Database } from "../../src/domain/types";
import { manageLabel } from "../../src/server/commands/labels";
import { ctx, ensurePasswordHash, withStore } from "./helpers/api-fixtures";

before(ensurePasswordHash);

/** Two of Alex's lists: « Nathan » and « Livres » in w1, nothing in w2. */
function lists(): Database {
  let doc = emptyDatabase();
  doc.users.push({ id: "alex", email: "alex@example.test", passwordHash: "x", displayName: "Alex", createdAt: "2026-01-01T00:00:00.000Z", emailVerifiedAt: "2026-01-01T00:00:00.000Z", mustChangePassword: false });
  for (const id of ["w1", "w2"]) {
    const created = createWishlist(doc, { ownerId: "alex", title: id, importTemplate: false, id });
    if (!created.ok) throw new Error(created.error);
    doc = created.doc;
  }
  doc.types.push({ id: "books", wishlistId: "w1", label: "Livres", sortOrder: 0 }, { id: "games", wishlistId: "w1", label: "Jeux", sortOrder: 1 });
  doc.people.push({ id: "nathan", wishlistId: "w1", label: "Nathan" }, { id: "wilh", wishlistId: "w1", label: "Wilh" });
  return doc;
}

const inW1 = { wishlistId: "w1", actorId: "alex" };

test("adding a « qui » or a category already there: refused, ignoring case and whitespace", () => {
  const doc = lists();
  for (const label of ["Nathan", "nathan", "  NATHAN "]) {
    assert.deepEqual(addPerson(doc, { ...inW1, label }), { ok: false, error: "personExists" });
  }
  for (const label of ["Livres", " livres"]) {
    assert.deepEqual(addType(doc, { ...inW1, label }), { ok: false, error: "typeExists" });
  }
});

test("the same name in another list, or a similar name, is still allowed", () => {
  const doc = lists();
  assert.ok(addPerson(doc, { wishlistId: "w2", actorId: "alex", label: "Nathan" }).ok);
  assert.ok(addType(doc, { wishlistId: "w2", actorId: "alex", label: "Livres" }).ok);
  assert.ok(addPerson(doc, { ...inW1, label: "Nathan et Wilh" }).ok);
  // A category and a « qui » can have the same name: they are not the same menus.
  assert.ok(addType(doc, { ...inW1, label: "Nathan" }).ok);
});

test("renaming to a taken name: refused; changing the case of one's own name: allowed", () => {
  const doc = lists();
  assert.deepEqual(renamePerson(doc, { ...inW1, personId: "wilh", label: "nathan" }), { ok: false, error: "personExists" });
  assert.deepEqual(renameType(doc, { ...inW1, typeId: "games", label: "LIVRES" }), { ok: false, error: "typeExists" });
  const recased = renamePerson(doc, { ...inW1, personId: "nathan", label: "NATHAN" });
  assert.ok(recased.ok);
  if (!recased.ok) return;
  assert.equal(recased.doc.people.find((p) => p.id === "nathan")?.label, "NATHAN");
  assert.ok(renameType(doc, { ...inW1, typeId: "books", label: "livres" }).ok);
});

test("renaming a missing entry to a taken name: the missing entry is reported first", () => {
  const doc = lists();
  assert.deepEqual(renamePerson(doc, { ...inW1, personId: "absent", label: "Nathan" }), { ok: false, error: "personMissing" });
  assert.deepEqual(renameType(doc, { ...inW1, typeId: "absent", label: "Livres" }), { ok: false, error: "typeMissing" });
});

test("the comparison does not depend on the server's language: « I » and « i » are equal", () => {
  const doc = lists();
  const added = addPerson(doc, { ...inW1, label: "Iris" });
  assert.ok(added.ok);
  if (!added.ok) return;
  assert.deepEqual(addPerson(added.doc, { ...inW1, label: "iris" }), { ok: false, error: "personExists" });
});

test("command (site and API): the refusal is returned as is, nothing is added", async () => {
  const doc = lists();
  await withStore(doc, async () => {
    const alex = ctx(doc.users[0]!);
    assert.deepEqual(await manageLabel(alex, { kind: "person", op: "add", wishlistId: "w1", label: "nathan" }), { ok: false, error: "personExists" });
    assert.deepEqual(await manageLabel(alex, { kind: "type", op: "rename", wishlistId: "w1", id: "games", label: "Livres" }), { ok: false, error: "typeExists" });
    const added = await manageLabel(alex, { kind: "person", op: "add", wishlistId: "w1", label: "Lou" });
    assert.ok(added.ok);
  });
});
