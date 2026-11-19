import assert from "node:assert/strict";
import { test } from "node:test";
import { decideLocaleRoute, internalPath, stripLocalePrefix, withLocale } from "../../src/i18n/locale-path";

test("withLocale does not double the prefix", () => {
  assert.equal(withLocale("fr", "/faq"), "/faq");
  assert.equal(withLocale("en", "/faq"), "/en/faq");
  assert.equal(withLocale("en", "/"), "/en");
  assert.equal(withLocale("en", "/en/faq"), "/en/faq");
  assert.equal(withLocale("fr", "/en/faq"), "/faq");
  assert.equal(withLocale("fr", "/fr/guide"), "/guide");
  assert.equal(withLocale("en", "/l/demo?qui=1#idee"), "/en/l/demo?qui=1#idee");
  assert.deepEqual(stripLocalePrefix("/en/l/demo"), { locale: "en", path: "/l/demo" });
});

test("?lang= leads to the canonical address and keeps the other parameters", () => {
  assert.deepEqual(decideLocaleRoute({ pathname: "/faq", search: "?lang=en&x=1", nextUrl: null }), {
    type: "redirect",
    status: 301,
    pathname: "/en/faq",
    search: "?x=1",
    locale: "en",
  });
  assert.deepEqual(decideLocaleRoute({ pathname: "/en/faq", search: "?lang=fr", nextUrl: null }), {
    type: "redirect",
    status: 301,
    pathname: "/faq",
    search: "",
    locale: "fr",
  });
});

test("/fr redirects to unprefixed French, /en is rewritten", () => {
  const frenchPrefix = decideLocaleRoute({ pathname: "/fr/guide", search: "", nextUrl: null });
  assert.equal(frenchPrefix.type, "redirect");
  if (frenchPrefix.type === "redirect") assert.equal(frenchPrefix.pathname, "/guide");
  assert.deepEqual(decideLocaleRoute({ pathname: "/en/guide", search: "?x=1", nextUrl: null }), {
    type: "rewrite",
    pathname: "/guide",
    search: "?x=1",
    locale: "en",
  });
  assert.deepEqual(decideLocaleRoute({ pathname: "/en", search: "", nextUrl: null }), {
    type: "rewrite",
    pathname: "/",
    search: "",
    locale: "en",
  });
});

test("navigating from /en keeps the prefix, a French address stays French", () => {
  assert.deepEqual(decideLocaleRoute({ pathname: "/guide", search: "", nextUrl: "/en/faq" }), {
    type: "redirect",
    status: 307,
    pathname: "/en/guide",
    search: "",
    locale: "en",
  });
  assert.deepEqual(decideLocaleRoute({ pathname: "/faq", search: "", nextUrl: null }), {
    type: "continue",
    locale: "fr",
  });
  assert.equal(decideLocaleRoute({ pathname: "/faq", search: "", nextUrl: "https://evil.example/en" }).type, "continue");
});

test("internalPath: a site path only, never another origin", () => {
  assert.equal(internalPath("/inviter/abc?x=1"), "/inviter/abc?x=1");
  assert.equal(internalPath("/"), "/");
  for (const value of ["//ailleurs.example", "/\\ailleurs.example", "https://ailleurs.example", "inviter", "", null, 3]) {
    assert.equal(internalPath(value), null, String(value));
  }
});

const route = (pathname: string, search = "", method?: string) =>
  decideLocaleRoute({ pathname, search, nextUrl: null, method });

test("a former address redirects permanently to its English address, in one step", () => {
  const redirect = (pathname: string, search: string, locale: "fr" | "en") => ({
    type: "redirect",
    status: 301,
    pathname,
    search,
    locale,
  });
  assert.deepEqual(route("/compte"), redirect("/account", "", "fr"));
  assert.deepEqual(route("/en/compte/export"), redirect("/en/account/export", "", "en"));
  assert.deepEqual(route("/fr/listes/abc", "?onglet=partage"), redirect("/lists/abc", "?tab=sharing", "fr"));
  assert.deepEqual(
    route("/connexion", "?next=%2Flistes%2Fabc&lang=en"),
    redirect("/en/login", "?next=%2Flists%2Fabc", "en"),
  );
  assert.deepEqual(route("/en/inviter/tok", "?lang=fr"), redirect("/invite/tok", "", "fr"));
  assert.deepEqual(route("/lists/abc", "?onglet=partage"), redirect("/lists/abc", "?tab=sharing", "fr"));
  assert.deepEqual(route("/l/read/reserver", "?itemId=x"), redirect("/l/read/reserve", "?itemId=x", "fr"));
  assert.deepEqual(route("/compte", "", "HEAD"), redirect("/account", "", "fr"));
});

test("a form posted to a former address is rewritten, not redirected", () => {
  assert.deepEqual(route("/listes/abc", "?onglet=partage", "POST"), {
    type: "rewrite",
    pathname: "/lists/abc",
    search: "?tab=sharing",
    locale: "fr",
  });
  assert.deepEqual(route("/en/compte", "", "POST"), { type: "rewrite", pathname: "/account", search: "", locale: "en" });
});

test("current addresses are served without a redirect", () => {
  for (const pathname of ["/", "/faq", "/l/read", "/l/read/types", "/lists/abc", "/account"]) {
    assert.deepEqual(route(pathname), { type: "continue", locale: "fr" }, pathname);
  }
  assert.deepEqual(route("/en/lists/abc", "?tab=sharing"), {
    type: "rewrite",
    pathname: "/lists/abc",
    search: "?tab=sharing",
    locale: "en",
  });
});

test("a former address reached from an English page keeps English, in one step", () => {
  assert.deepEqual(decideLocaleRoute({ pathname: "/compte", search: "", nextUrl: "/en/faq" }), {
    type: "redirect",
    status: 301,
    pathname: "/en/account",
    search: "",
    locale: "en",
  });
});

test("a doubled slash behind the language prefix is not translated as a former address", () => {
  // `/en//host` keeps its pre-018 handling (rewrite on this server); the legacy table does not touch it.
  assert.deepEqual(route("/en//evil.test", "?onglet=idees"), {
    type: "rewrite",
    pathname: "//evil.test",
    search: "?onglet=idees",
    locale: "en",
  });
});
