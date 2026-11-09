import assert from "node:assert/strict";
import { test } from "node:test";
import { LIST_TAB_LABEL_KEY, LIST_TABS, parseListTab } from "../../src/site/list-tabs";
import listFr from "../../locales/fr/list.json";

test("a list tab is read from its English name", () => {
  for (const tab of LIST_TABS) assert.equal(parseListTab(tab), tab);
});

test("former French tab values, still posted by pages opened before 018, are accepted", () => {
  assert.equal(parseListTab("idees"), "ideas");
  assert.equal(parseListTab("archives"), "archive");
  assert.equal(parseListTab("partage"), "sharing");
  assert.equal(parseListTab("reglages"), "settings");
  assert.equal(parseListTab("categories"), "settings");
});

test("an unknown or missing tab is the ideas tab", () => {
  for (const value of [undefined, null, "", "unknown", "__proto__", "toString"]) assert.equal(parseListTab(value), "ideas", String(value));
});

test("each tab has a label in the locale files", () => {
  for (const tab of LIST_TABS) {
    const [, key] = LIST_TAB_LABEL_KEY[tab].split(".");
    assert.equal(typeof (listFr.tabs as Record<string, string>)[key], "string", tab);
  }
});
