import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizePriority, parsePriority } from "../../src/domain/priority";

test("priorité 1–5 ou vide", () => {
  assert.equal(parsePriority(null), null);
  assert.equal(parsePriority(""), null);
  assert.equal(parsePriority("3"), 3);
  assert.equal(parsePriority("6"), null);
  assert.equal(parsePriority("★"), null);
  assert.deepEqual(normalizePriority("5"), { ok: true, value: "5" });
  assert.deepEqual(normalizePriority("  "), { ok: true, value: null });
  assert.equal(normalizePriority("0").ok, false);
});
