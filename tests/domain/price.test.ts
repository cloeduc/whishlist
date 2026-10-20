import assert from "node:assert/strict";
import { test } from "node:test";
import { formatPrice, parsePrice } from "../../src/domain/price";

test("parsePrice accepte virgule et point", () => {
  assert.equal(parsePrice("18,50"), 1850);
  assert.equal(parsePrice("18.50"), 1850);
  assert.equal(parsePrice(""), null);
  assert.equal(parsePrice("abc"), "invalid");
});

test("formatPrice localisé EUR", () => {
  assert.equal(formatPrice(7800, "fr-FR"), "78,00 €");
  assert.equal(formatPrice(7800, "en-US"), "€78.00");
  assert.equal(formatPrice(null), null);
});
