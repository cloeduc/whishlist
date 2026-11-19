import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  LEGACY_PATHS,
  canonicalInternalPath,
  canonicalSitePath,
  formerPathsUnder,
} from "../../src/site/legacy-paths";

const path = (value: string) => canonicalSitePath(value, "").path;
const query = (search: string) => canonicalSitePath("/lists/abc", search).search;

test("each former page path becomes its English path", () => {
  const cases: [string, string][] = [
    ["/listes/new", "/lists/new"],
    ["/listes/abc", "/lists/abc"],
    ["/compte", "/account"],
    ["/compte/export", "/account/export"],
    ["/inscription", "/register"],
    ["/connexion", "/login"],
    ["/mot-de-passe-oublie", "/forgot-password"],
    ["/changer-mot-de-passe", "/change-password"],
    ["/reinitialiser/tok", "/reset-password/tok"],
    ["/confirmer-email/tok", "/confirm-email/tok"],
    ["/inviter/tok", "/invite/tok"],
    ["/l/read/reserver", "/l/read/reserve"],
    ["/mentions-legales", "/legal-notice"],
    ["/donnees-personnelles", "/privacy"],
    ["/projet", "/about"],
  ];
  for (const [from, to] of cases) {
    const result = canonicalSitePath(from, "");
    assert.deepEqual(result, { path: to, search: "", changed: true }, from);
  }
});

test("a trailing slash is kept, without a loop", () => {
  assert.equal(path("/compte/"), "/account/");
  assert.equal(canonicalSitePath("/account/", "").changed, false);
});

test("current and unrelated paths are left alone", () => {
  for (const value of ["/", "/faq", "/guide", "/l/read", "/l/read/types", "/l/read/reserve", "/lists/abc", "/listesX", "/account", "/api/v1/lists"]) {
    assert.deepEqual(canonicalSitePath(value, ""), { path: value, search: "", changed: false }, value);
  }
});

test("the list tab parameter gets its English name and value", () => {
  assert.equal(query("?onglet=partage"), "?tab=sharing");
  assert.equal(query("?onglet=idees"), "?tab=ideas");
  assert.equal(query("?onglet=archives"), "?tab=archive");
  assert.equal(query("?onglet=reservations"), "?tab=reservations");
  assert.equal(query("?onglet=reglages"), "?tab=settings");
  assert.equal(query("?onglet=unknown"), "?tab=unknown");
  assert.equal(query("?tab=sharing&onglet=reglages"), "?tab=sharing");
});

test("return paths are renamed and translated, external ones are left alone", () => {
  assert.equal(query("?suite=%2Finviter%2FI"), "?next=%2Finvite%2FI");
  assert.equal(query("?next=%2Fen%2Flistes%2Fabc%3Fonglet%3Dpartage"), "?next=%2Fen%2Flists%2Fabc%3Ftab%3Dsharing");
  assert.equal(query("?next=https%3A%2F%2Fevil.test%2Flistes"), "?next=https%3A%2F%2Fevil.test%2Flistes");
  assert.equal(query("?next=%2F%2Fevil.test%2Flistes"), "?next=%2F%2Fevil.test%2Flistes");
  assert.equal(canonicalSitePath("/login", "?next=%2Flists%2Fabc").changed, false);
});

test("action result parameters get English names", () => {
  assert.equal(query("?ok=1&lien=x&envoi=echec"), "?ok=1&link=x&mail=failed");
  assert.equal(query("?ok=1&sansmail=1"), "?ok=1&nomail=1");
  assert.equal(query("?ok=1&compte=1"), "?ok=1&own=1");
});

test("other parameters and their order are kept", () => {
  assert.equal(query("?e=forbidden&onglet=partage&x=1"), "?e=forbidden&tab=sharing&x=1");
  const untouched = canonicalSitePath("/lists/abc", "?e=forbidden&ok=1");
  assert.deepEqual(untouched, { path: "/lists/abc", search: "?e=forbidden&ok=1", changed: false });
});

test("a full internal address keeps its language prefix, query and hash", () => {
  assert.equal(canonicalInternalPath("/en/listes/x?onglet=partage#a"), "/en/lists/x?tab=sharing#a");
  assert.equal(canonicalInternalPath("/fr/compte"), "/account");
  assert.equal(canonicalInternalPath("/inviter/I"), "/invite/I");
  assert.equal(canonicalInternalPath("/lists/x"), "/lists/x");
  assert.equal(canonicalInternalPath("//evil.test/listes"), null);
  assert.equal(canonicalInternalPath("https://evil.test"), null);
  assert.equal(canonicalInternalPath(null), null);
});

test("an address that only looks internal behind its language prefix never becomes external", () => {
  for (const value of ["/en//evil.test?onglet=idees", "/fr//evil.test?onglet=idees", "/en//evil.test/listes?suite=%2Flistes"]) {
    const result = canonicalInternalPath(value);
    assert.equal(result === null || !result.startsWith("//"), true, `${value} → ${result}`);
  }
  assert.deepEqual(canonicalSitePath("//evil.test", "?onglet=idees"), { path: "//evil.test", search: "?onglet=idees", changed: false });
  assert.equal(query("?next=%2Fen%2F%2Fevil.test%3Fonglet%3Didees"), "?next=%2Fen%2F%2Fevil.test%3Fonglet%3Didees");
});

const words = (value: string) => value.split(/[/-]/).filter((part) => part && !part.startsWith(":"));
const appDir = (value: string) => join(process.cwd(), "app", ...value.split("/").filter(Boolean).map((part) => (part.startsWith(":") ? `[${part.slice(1)}]` : part)));

// "l" and "email" are the same in both languages.
test("the table has no chain and no French word in a new path", () => {
  const froms = new Set(LEGACY_PATHS.map((rule) => rule.from));
  const french = new Set(LEGACY_PATHS.flatMap((rule) => words(rule.from)).filter((word) => !["l", "email"].includes(word)));
  for (const rule of LEGACY_PATHS) {
    assert.equal(froms.has(rule.to), false, rule.to);
    for (const word of words(rule.to)) assert.equal(french.has(word), false, `${rule.to}: ${word}`);
  }
});

test("each new path is a page folder and no former path still is one", () => {
  for (const rule of LEGACY_PATHS) {
    assert.equal(existsSync(appDir(rule.to)), true, rule.to);
    assert.equal(existsSync(appDir(rule.from)), false, rule.from);
  }
});

test("former private paths are derived from the table, with the trailing slash of each prefix", () => {
  assert.deepEqual(
    formerPathsUnder(["/l/", "/invite/", "/reset-password/", "/confirm-email/", "/account", "/lists/"]),
    ["/inviter/", "/reinitialiser/", "/confirmer-email/", "/compte", "/listes/"],
  );
  assert.deepEqual(formerPathsUnder(["/faq", "/l"]), []);
});
