import assert from "node:assert/strict";
import { before, test } from "node:test";
import { createList } from "../../src/server/commands/lists";
import { apiDoc, ctx, ensurePasswordHash, withStore } from "./helpers/api-fixtures";

before(ensurePasswordHash);

test("creation: empty fields → default values (FR language)", async () => {
  const doc = apiDoc();
  const user = doc.users[1]!;
  const c = ctx(user); // locale "fr"
  await withStore(doc, async () => {
    const created = await createList(c, { title: "", category: "", person: "" });
    assert.equal(created.ok, true);
    if (!created.ok) return;
    assert.equal(created.list.title, `Liste de ${user.displayName}`);
    assert.deepEqual(created.list.categories.map((x) => x.label), ["Cadeaux"]);
    assert.deepEqual(created.list.people.map((x) => x.label), [user.displayName]);
  });
});

test("creation: a second default name is numbered", async () => {
  const doc = apiDoc();
  const user = doc.users[1]!;
  const c = ctx(user);
  await withStore(doc, async () => {
    const first = await createList(c, { title: "", category: "", person: "" });
    const second = await createList(c, { title: "", category: "", person: "" });
    assert.equal(second.ok, true);
    if (!first.ok || !second.ok) return;
    assert.equal(second.list.title, `Liste de ${user.displayName} 2`);
  });
});

test("creation: provided values take precedence over defaults", async () => {
  const doc = apiDoc();
  const c = ctx(doc.users[1]!);
  await withStore(doc, async () => {
    const created = await createList(c, { title: "Noël", category: "Livres", person: "Camille" });
    assert.equal(created.ok, true);
    if (!created.ok) return;
    assert.equal(created.list.title, "Noël");
    assert.deepEqual(created.list.categories.map((x) => x.label), ["Livres"]);
    assert.deepEqual(created.list.people.map((x) => x.label), ["Camille"]);
  });
});

test("creation: empty display name (old imported account) → fallback labels", async () => {
  const doc = apiDoc();
  doc.users[1]!.displayName = "";
  await withStore(doc, async () => {
    const created = await createList(ctx(doc.users[1]!), { title: "", category: "", person: "" });
    assert.equal(created.ok, true);
    if (!created.ok) return;
    assert.equal(created.list.title, "Ma liste");
    assert.deepEqual(created.list.people.map((x) => x.label), ["Moi"]);
  });
});

test("creation: the display name is used as is, without escaping", async () => {
  const doc = apiDoc();
  doc.users[1]!.displayName = "Léa & Tom";
  await withStore(doc, async () => {
    const created = await createList(ctx(doc.users[1]!), { title: "", category: "", person: "" });
    assert.equal(created.ok, true);
    if (!created.ok) return;
    assert.equal(created.list.title, "Liste de Léa & Tom");
    assert.deepEqual(created.list.people.map((x) => x.label), ["Léa & Tom"]);
  });
});

test("creation in English: English default values", async () => {
  const doc = apiDoc();
  const user = doc.users[1]!;
  await withStore(doc, async () => {
    const created = await createList({ ...ctx(user), locale: "en" }, { title: "", category: "", person: "" });
    assert.equal(created.ok, true);
    if (!created.ok) return;
    assert.equal(created.list.title, `${user.displayName}’s list`);
    assert.deepEqual(created.list.categories.map((x) => x.label), ["Gifts"]);
  });
});

test("creation with #3: a comma-separated entry creates several; an empty or comma-only field takes the default", async () => {
  const doc = apiDoc();
  const user = doc.users[1]!;
  const c = ctx(user);
  await withStore(doc, async () => {
    const several = await createList(c, { title: "Noël", category: "Livres, Jeux", person: " , " });
    assert.equal(several.ok, true);
    if (!several.ok) return;
    assert.deepEqual(several.list.categories.map((x) => x.label), ["Livres", "Jeux"]);
    assert.deepEqual(several.list.people.map((x) => x.label), [user.displayName], "que des virgules : le défaut");
  });
});

test("creation: the account name used by default is never split, even with a comma", async () => {
  const doc = apiDoc();
  const user = doc.users[1]!;
  user.displayName = "Dupont, Marie";
  await withStore(doc, async () => {
    const created = await createList(ctx(user), { title: "", category: "", person: "" });
    assert.equal(created.ok, true);
    if (!created.ok) return;
    assert.deepEqual(created.list.people.map((x) => x.label), ["Dupont, Marie"]);
  });
});
