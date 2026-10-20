import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { emptyDatabase } from "../../src/domain/types";
import { registerUser } from "../../src/domain/users";
import { readDocument, updateDocument } from "../../src/store/db";

test("e-mail unique, casse, nom vide, hash", () => {
  const first = registerUser(emptyDatabase(), {
    email: " Ada@Example.com ",
    password: "secret",
    displayName: "Ada",
  });
  assert.equal(first.ok, true);
  if (!first.ok) return;
  assert.equal(first.value.email, "ada@example.com");
  assert.notEqual(first.value.passwordHash, "secret");
  const second = registerUser(first.doc, {
    email: "ada@example.com",
    password: "autre",
    displayName: "Ada",
  });
  assert.equal(second.ok, false);
  const blank = registerUser(emptyDatabase(), {
    email: "a@b.c",
    password: "secret",
    displayName: "   ",
  });
  assert.equal(blank.ok, false);
});

test("deux inscriptions simultanées du même e-mail", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "wl-acc-"));
  process.env.WISHLIST_DATA_PATH = path.join(dir, "wishlist.json");
  try {
    const input = { email: "same@example.com", password: "secret", displayName: "Sam" };
    await Promise.all([
      updateDocument((doc) => {
        const result = registerUser(doc, input);
        return { doc: result.ok ? result.doc : doc, result };
      }),
      updateDocument((doc) => {
        const result = registerUser(doc, input);
        return { doc: result.ok ? result.doc : doc, result };
      }),
    ]);
    const doc = await readDocument();
    assert.equal(doc.users.length, 1);
  } finally {
    delete process.env.WISHLIST_DATA_PATH;
    await rm(dir, { recursive: true, force: true });
  }
});
