import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { before, test } from "node:test";
import Database from "better-sqlite3";
import { createWishlist } from "../../src/domain/import";
import { createItem, updateItem } from "../../src/domain/items";
import { emptyDatabase } from "../../src/domain/types";
import { itemFieldsFrom } from "../../src/server/api/item-body";
import { toMemberItem, toPublicListView } from "../../src/server/api/views";
import { saveItem } from "../../src/server/commands/items";
import { closeStore, databaseFilePath, openStore, readDocument } from "../../src/store/db";
import { apiDoc, ctx, ensurePasswordHash, withStore } from "./helpers/api-fixtures";
import { withTempDataPath } from "./helpers/temp-store";

before(ensurePasswordHash);

function ready() {
  const doc = emptyDatabase();
  doc.users.push({
    id: "u",
    email: "a@b.c",
    passwordHash: "x",
    displayName: "A",
    createdAt: "2026-01-01T00:00:00.000Z",
    mustChangePassword: false,
    emailVerifiedAt: "2026-01-01T00:00:00.000Z",
  });
  const created = createWishlist(doc, { ownerId: "u", title: "L", importTemplate: false, id: "w" });
  if (!created.ok) throw new Error(created.error);
  created.doc.types.push({ id: "t", wishlistId: "w", label: "Livres", sortOrder: 0 });
  created.doc.people.push({ id: "p", wishlistId: "w", label: "Alex" });
  return created.doc;
}

const base = { wishlistId: "w", actorId: "u", name: "Roman", typeId: "t", personId: "p" };

test("creation: unchecked by default, checked if requested", () => {
  const unset = createItem(ready(), base);
  assert.equal(unset.ok && unset.item.secondHandOk, false);
  const set = createItem(ready(), { ...base, secondHandOk: true });
  assert.equal(set.ok && set.item.secondHandOk, true);
});

test("update: absent keeps the value, false clears it", () => {
  const created = createItem(ready(), { ...base, secondHandOk: true });
  assert.ok(created.ok);
  if (!created.ok) return;
  const itemId = created.item.id;
  const kept = updateItem(created.doc, { ...base, itemId, name: "Roman (poche)" });
  assert.ok(kept.ok);
  if (!kept.ok) return;
  assert.equal(kept.doc.items.find((i) => i.id === itemId)?.secondHandOk, true);
  const cleared = updateItem(kept.doc, { ...base, itemId, secondHandOk: false });
  assert.ok(cleared.ok);
  if (!cleared.ok) return;
  assert.equal(cleared.doc.items.find((i) => i.id === itemId)?.secondHandOk, false);
});

test("API body: only a real boolean is passed on", () => {
  assert.equal(itemFieldsFrom("w", { name: "x" }).secondHandOk, undefined);
  assert.equal(itemFieldsFrom("w", { name: "x", secondHandOk: true }).secondHandOk, true);
  assert.equal(itemFieldsFrom("w", { name: "x", secondHandOk: false }).secondHandOk, false);
  assert.equal(itemFieldsFrom("w", { name: "x", secondHandOk: "true" }).secondHandOk, undefined);
});

test("a client older than 1.5.0 that updates an idea does not uncheck « l'occasion me va »", async () => {
  const doc = apiDoc();
  const alex = ctx(doc.users[0]!);
  await withStore(doc, async () => {
    const created = await saveItem(alex, {
      wishlistId: "w",
      name: "Jeu de société",
      typeId: "t",
      personId: "p",
      url: "",
      imageUrl: "",
      price: "",
      priority: "",
      secondHandOk: true,
    });
    assert.ok(created.ok);
    if (!created.ok) return;
    // PUT from an old client: all fields, except secondHandOk.
    const oldClient = itemFieldsFrom(
      "w",
      { name: "Jeu de société (édition 2)", typeId: "t", personId: "p", url: "", imageUrl: "", price: "", priority: "" },
      created.item.id,
    );
    const edited = await saveItem(alex, oldClient);
    assert.ok(edited.ok);
    if (!edited.ok) return;
    assert.equal(edited.item.name, "Jeu de société (édition 2)");
    assert.equal(edited.item.secondHandOk, true);
  });
});

test("JSON views: the field is present for members and for the public page", () => {
  const created = createItem(ready(), { ...base, secondHandOk: true });
  assert.ok(created.ok);
  if (!created.ok) return;
  assert.equal(toMemberItem(created.item, "fr").secondHandOk, true);
  const list = created.doc.wishlists[0]!;
  const view = toPublicListView(created.doc, list, "fr", new Set());
  assert.equal(view.items[0]?.secondHandOk, true);
});

test("old JSON file without the field: imported as unchecked", async () => {
  await withTempDataPath(async (dataPath) => {
    const legacy = apiDoc() as unknown as { items: Record<string, unknown>[] };
    for (const item of legacy.items) delete item.secondHandOk;
    await writeFile(dataPath, JSON.stringify(legacy), "utf8");
    const doc = await readDocument();
    assert.ok(doc.items.length > 0);
    assert.ok(doc.items.every((item) => item.secondHandOk === false));
  });
});

test("existing database from before this field: the migration adds it, unchecked, without losing ideas", async () => {
  await withTempDataPath(async () => {
    const file = databaseFilePath();
    const init = readFileSync(path.join(process.cwd(), "drizzle", "0000_init.sql"), "utf8");
    const journal = JSON.parse(readFileSync(path.join(process.cwd(), "drizzle", "meta", "_journal.json"), "utf8")) as {
      entries: { tag: string; when: number }[];
    };
    const initWhen = journal.entries.find((entry) => entry.tag === "0000_init")!.when;

    // The database as it was: only the first migration applied, one idea in it.
    const old = new Database(file);
    for (const statement of init.split("--> statement-breakpoint")) if (statement.trim()) old.exec(statement);
    old.exec("CREATE TABLE IF NOT EXISTS __drizzle_migrations (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at numeric)");
    old.prepare("INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)").run("init", initWhen);
    old.exec("insert into meta values ('legacy_import', 'none')");
    old.exec(`insert into wishlists values ('w9', 'L', null, null, '{}', 'rt9', 'it9', null, 0, '2026-01-01')`);
    old.exec("insert into types values ('t9', 'w9', 'T', 0)");
    old.exec("insert into people values ('p9', 'w9', 'P')");
    old.exec("insert into items values ('i9', 'w9', 'Déjà là', 't9', null, null, null, null, 'p9', 0, 0)");
    old.close();

    openStore();
    const doc = await readDocument();
    assert.deepEqual(
      doc.items.map((item) => ({ id: item.id, name: item.name, secondHandOk: item.secondHandOk })),
      [{ id: "i9", name: "Déjà là", secondHandOk: false }],
    );
    closeStore();
    const check = new Database(file, { readonly: true });
    try {
      const columns = (check.prepare("pragma table_info(items)").all() as { name: string }[]).map((c) => c.name);
      assert.ok(columns.includes("second_hand_ok"));
    } finally {
      check.close();
    }
  });
});
