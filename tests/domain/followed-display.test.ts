import assert from "node:assert/strict";
import { test } from "node:test";
import { followedDisplay } from "../../src/domain/followed-display";

test("followedDisplay prefers the subscriber's names, then the list's", () => {
  const names = { title: "Ma liste", customTitle: null, ownerName: "Léa", customOwnerName: null };
  assert.deepEqual(followedDisplay(names), { title: "Ma liste", person: "Léa" });
  assert.deepEqual(followedDisplay({ ...names, customTitle: "Noël de Léa", customOwnerName: "Mamie" }), {
    title: "Noël de Léa",
    person: "Mamie",
  });
  assert.deepEqual(followedDisplay({ ...names, ownerName: null }), { title: "Ma liste", person: null });
});
