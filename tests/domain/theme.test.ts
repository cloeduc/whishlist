import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_WISHLIST_THEME,
  parseThemeForm,
  resolveTheme,
  themeToCssVars,
} from "../../src/domain/theme";

test("resolveTheme merge + defaults", () => {
  assert.deepEqual(resolveTheme(null), DEFAULT_WISHLIST_THEME);
  assert.equal(resolveTheme({ primary: "#ABC" }).primary, "#aabbcc");
  assert.equal(resolveTheme({ primary: "nope" }).primary, DEFAULT_WISHLIST_THEME.primary);
});

test("parseThemeForm valide ou rejette", () => {
  const ok = parseThemeForm({
    primary: "#1E60FF",
    accent: "#f00",
    highlight: "#ffd700",
    background: "#e8f0ff",
  });
  assert.equal(ok.ok, true);
  if (!ok.ok) return;
  assert.equal(ok.theme.primary, "#1e60ff");
  assert.equal(ok.theme.accent, "#ff0000");

  const bad = parseThemeForm({ primary: "red" });
  assert.equal(bad.ok, false);
});

test("themeToCssVars mappe les tokens", () => {
  const vars = themeToCssVars(DEFAULT_WISHLIST_THEME);
  assert.equal(vars["--main"], DEFAULT_WISHLIST_THEME.primary);
  assert.equal(vars["--destructive"], DEFAULT_WISHLIST_THEME.accent);
  assert.equal(vars["--highlight"], DEFAULT_WISHLIST_THEME.highlight);
});
