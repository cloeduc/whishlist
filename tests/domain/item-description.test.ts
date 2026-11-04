import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, before, test } from "node:test";
import Database from "better-sqlite3";
import { exportAccount } from "../../src/domain/account";
import { MAX_DESCRIPTION } from "../../src/domain/description";
import { createWishlist } from "../../src/domain/import";
import { createItem, updateItem } from "../../src/domain/items";
import { cleanDescription, extractProductHints, mergeHints } from "../../src/domain/product-from-url";
import { refineProductWithLlm } from "../../src/domain/product-llm";
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
    emailVerifiedAt: "2026-01-01T00:00:00.000Z",
    mustChangePassword: false,
  });
  const created = createWishlist(doc, { ownerId: "u", title: "L", importTemplate: false, id: "w" });
  if (!created.ok) throw new Error(created.error);
  created.doc.types.push({ id: "t", wishlistId: "w", label: "Livres", sortOrder: 0 });
  created.doc.people.push({ id: "p", wishlistId: "w", label: "Alex" });
  return created.doc;
}

const base = { wishlistId: "w", actorId: "u", name: "Liseuse", typeId: "t", personId: "p" };

// --- Idea rules ---

test("creation: no description → null; text kept with its line breaks, surrounding whitespace trimmed", () => {
  const none = createItem(ready(), base);
  assert.equal(none.ok && none.item.description, null);
  const blank = createItem(ready(), { ...base, description: "  \n " });
  assert.equal(blank.ok && blank.item.description, null);
  const text = createItem(ready(), { ...base, description: "  Pour lire au lit.\r\nÉcran sans reflet.  " });
  assert.equal(text.ok && text.item.description, "Pour lire au lit.\nÉcran sans reflet.");
});

test(`beyond ${MAX_DESCRIPTION} characters: refused, on creation as on edit`, () => {
  const long = "a".repeat(MAX_DESCRIPTION + 1);
  assert.deepEqual(createItem(ready(), { ...base, description: long }), { ok: false, error: "descriptionTooLong" });
  const exact = createItem(ready(), { ...base, description: "a".repeat(MAX_DESCRIPTION) });
  assert.ok(exact.ok);
  if (!exact.ok) return;
  const update = updateItem(exact.doc, { ...base, itemId: exact.item.id, description: long });
  assert.deepEqual(update, { ok: false, error: "descriptionTooLong" });
});

test("edit: absent keeps the description, empty or null erases it", () => {
  const created = createItem(ready(), { ...base, description: "Pour lire au lit." });
  assert.ok(created.ok);
  if (!created.ok) return;
  const itemId = created.item.id;
  const kept = updateItem(created.doc, { ...base, itemId, name: "Liseuse 7 pouces" });
  assert.ok(kept.ok);
  if (!kept.ok) return;
  assert.equal(kept.doc.items.find((i) => i.id === itemId)?.description, "Pour lire au lit.");
  const emptied = updateItem(kept.doc, { ...base, itemId, description: "" });
  assert.ok(emptied.ok);
  if (!emptied.ok) return;
  assert.equal(emptied.doc.items.find((i) => i.id === itemId)?.description, null);
  const nulled = updateItem(kept.doc, { ...base, itemId, description: null });
  assert.ok(nulled.ok);
  if (!nulled.ok) return;
  assert.equal(nulled.doc.items.find((i) => i.id === itemId)?.description, null);
});

// --- API ---

test("API body: a string or null is passed through, anything else (absent, number) is not", () => {
  assert.equal(itemFieldsFrom("w", { name: "x" }).description, undefined);
  assert.equal(itemFieldsFrom("w", { name: "x", description: "Texte" }).description, "Texte");
  assert.equal(itemFieldsFrom("w", { name: "x", description: null }).description, null);
  assert.equal(itemFieldsFrom("w", { name: "x", description: 12 }).description, undefined);
});

test("a client older than 1.5.0 editing an idea does not erase its description", async () => {
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
      description: "Pour les soirées à quatre.",
    });
    assert.ok(created.ok);
    if (!created.ok) return;
    // PUT from an old client: all fields, except description.
    const oldClient = itemFieldsFrom(
      "w",
      { name: "Jeu de société (édition 2)", typeId: "t", personId: "p", url: "", imageUrl: "", price: "", priority: "" },
      created.item.id,
    );
    const edited = await saveItem(alex, oldClient);
    assert.ok(edited.ok);
    if (!edited.ok) return;
    assert.equal(edited.item.name, "Jeu de société (édition 2)");
    assert.equal(edited.item.description, "Pour les soirées à quatre.");
  });
});

test("JSON views and account export: the description is present", () => {
  const created = createItem(ready(), { ...base, description: "Pour lire au lit." });
  assert.ok(created.ok);
  if (!created.ok) return;
  assert.equal(toMemberItem(created.item, "fr").description, "Pour lire au lit.");
  const list = created.doc.wishlists[0]!;
  assert.equal(toPublicListView(created.doc, list, "fr", new Set()).items[0]?.description, "Pour lire au lit.");
  const exported = exportAccount(created.doc, "u", { origin: "https://example.test", locale: "fr" });
  assert.equal(exported?.lists[0]?.items[0]?.description, "Pour lire au lit.");
});

// --- Storage ---

test("old JSON file without the field: imported without a description", async () => {
  await withTempDataPath(async (dataPath) => {
    const legacy = apiDoc() as unknown as { items: Record<string, unknown>[] };
    for (const item of legacy.items) delete item.description;
    await writeFile(dataPath, JSON.stringify(legacy), "utf8");
    const doc = await readDocument();
    assert.ok(doc.items.length > 0);
    assert.ok(doc.items.every((item) => item.description === null));
  });
});

test("existing database from before this field: the migration adds the column without losing ideas", async () => {
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
      doc.items.map((item) => ({ id: item.id, name: item.name, description: item.description })),
      [{ id: "i9", name: "Déjà là", description: null }],
    );
    closeStore();
    const check = new Database(file, { readonly: true });
    try {
      const columns = (check.prepare("pragma table_info(items)").all() as { name: string }[]).map((c) => c.name);
      assert.ok(columns.includes("description"));
    } finally {
      check.close();
    }
  });
});

// --- Prefill from the link ---

test("product page: JSON-LD description as plain text, otherwise og:description, never the site's meta description", () => {
  const ld = extractProductHints(
    `<script type="application/ld+json">{"@type":"Product","name":"Liseuse","description":"<p>Écran 7&nbsp;pouces,<br>étanche.</p>"}</script>
     <meta property="og:description" content="Texte og" />`,
    "https://shop.example.com/p/1",
  );
  assert.equal(ld.description, "Écran 7 pouces, étanche.");
  const og = extractProductHints(
    `<meta property="og:title" content="Liseuse" /><meta property="og:description" content="Lire partout, même au soleil." />`,
    "https://shop.example.com/p/1",
  );
  assert.equal(og.description, "Lire partout, même au soleil.");
  const seoOnly = extractProductHints(
    `<meta property="og:title" content="Liseuse" /><meta name="description" content="Livraison gratuite dès 25 € !" />`,
    "https://shop.example.com/p/1",
  );
  assert.equal(seoOnly.description, null);
});

test("suggested description: cut at a word around 300 characters, with an ellipsis", () => {
  const long = `${"mot ".repeat(120)}fin`;
  const cleaned = cleanDescription(long)!;
  assert.ok(cleaned.length <= 300, String(cleaned.length));
  assert.ok(cleaned.endsWith("mot…"));
  assert.equal(cleanDescription("  court  "), "court");
  assert.equal(cleanDescription("<br>"), null);
});

test("merging hints: the AI description replaces the page's, otherwise the page's stays", () => {
  const page = { name: "Liseuse", price: null, imageUrl: null, typeId: null, description: "Texte de la page" };
  assert.equal(mergeHints(page, { description: "Texte de l'IA" }).description, "Texte de l'IA");
  assert.equal(mergeHints(page, { description: null }).description, "Texte de la page");
  assert.equal(mergeHints(page, { description: "  " }).description, "Texte de la page");
});

const realFetch = globalThis.fetch;
const realKeys = { gemini: process.env.GEMINI_API_KEY, openai: process.env.OPENAI_API_KEY };
afterEach(() => {
  globalThis.fetch = realFetch;
  process.env.GEMINI_API_KEY = realKeys.gemini ?? "";
  process.env.OPENAI_API_KEY = realKeys.openai ?? "";
});

test("AI: the prompt asks for a description in the person's language, and the response fills it", async () => {
  process.env.GEMINI_API_KEY = "";
  process.env.OPENAI_API_KEY = "test-key";
  const prompts: string[] = [];
  globalThis.fetch = (async (_url: string, init: { body: string }) => {
    prompts.push(JSON.parse(init.body).messages[1].content as string);
    const content = JSON.stringify({ name: "Liseuse", price: "129", imageUrl: null, typeLabel: "Livres", description: "An e-reader for reading in bed." });
    return new Response(JSON.stringify({ choices: [{ message: { content } }], usage: { total_tokens: 10 } }), { status: 200 });
  }) as unknown as typeof fetch;
  const hints = { name: null, price: null, imageUrl: null, typeId: null, description: null };
  const result = await refineProductWithLlm("https://shop.example.com/p/1", "<p>page</p>", hints, [{ id: "t", label: "Livres" }], "en");
  assert.equal(result.hints.description, "An e-reader for reading in bed.");
  assert.match(prompts[0]!, /"description": string\|null/);
  assert.match(prompts[0]!, /en anglais/);
  await refineProductWithLlm("https://shop.example.com/p/1", "<p>page</p>", hints, [], "fr");
  assert.match(prompts[1]!, /en français/);
});
