import assert from "node:assert/strict";
import { test } from "node:test";
import * as formState from "../../src/server/form-state";
import { keptValues, refusal } from "../../src/server/form-state";

function form(entries: Record<string, string | Blob>): FormData {
  const data = new FormData();
  for (const [name, value] of Object.entries(entries)) data.append(name, value);
  return data;
}

test("keptValues returns exactly the listed fields", () => {
  const data = form({ email: "ana@example.test", displayName: "Ana", next: "/listes" });
  assert.deepEqual(keptValues(data, ["email", "displayName"]), {
    email: "ana@example.test",
    displayName: "Ana",
  });
});

test("keptValues gives an empty string for a missing field or a file", () => {
  const data = form({ cover: new Blob(["x"]) });
  assert.deepEqual(keptValues(data, ["title", "cover"]), { title: "", cover: "" });
});

test("keptValues never returns a field that is not listed, such as a password", () => {
  const data = form({ email: "ana@example.test", password: "secret-secret" });
  const values = keptValues(data, ["email"]);
  assert.equal("password" in values, false);
});

test("refusal keeps the listed fields and counts the attempts", () => {
  const data = form({ email: "ana@example.test", password: "short" });
  const first = refusal(null, "password", data, ["email"]);
  assert.deepEqual(first, { error: "password", values: { email: "ana@example.test" }, attempt: 1 });
  assert.equal(refusal(first, "password", data, ["email"]).attempt, 2);
});

test("no list of kept fields holds a password or the anti-bot field", () => {
  const lists = (Object.entries(formState) as [string, unknown][]).filter(
    (entry): entry is [string, readonly string[]] => entry[0].endsWith("_KEPT_FIELDS") && Array.isArray(entry[1]),
  );
  assert.equal(lists.length, 13);
  for (const [name, fields] of lists) {
    for (const field of fields) {
      assert.doesNotMatch(field, /password|confirm/i, `${name} keeps ${field}`);
      assert.notEqual(field, "website", `${name} keeps the anti-bot field`);
    }
  }
});
