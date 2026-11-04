import assert from "node:assert/strict";
import { test } from "node:test";
import { faqPageJsonLd } from "../../src/site/faq-jsonld";
import { legacyHostRedirect, preferredOrigin, PUBLIC_ORIGIN } from "../../src/site/seo";

test("preferredOrigin replaces only the old domain", () => {
  assert.equal(preferredOrigin("https://wishlist.mesdamesduc.fr"), PUBLIC_ORIGIN);
  assert.equal(preferredOrigin("https://ohyoushouldnt.app"), "https://ohyoushouldnt.app");
  assert.equal(preferredOrigin("https://exemple.test"), "https://exemple.test");
  assert.equal(preferredOrigin(null), null);
});

test("legacyHostRedirect targets the public domain and keeps the path", () => {
  const moved = legacyHostRedirect(
    "wishlist.mesdamesduc.fr",
    "/faq",
    "?lang=en",
  );
  assert.equal(moved?.toString(), "https://ohyoushouldnt.app/faq?lang=en");
  assert.equal(legacyHostRedirect("ohyoushouldnt.app", "/faq", ""), null);
  assert.equal(legacyHostRedirect("evil.example", "/", ""), null);
  assert.equal(legacyHostRedirect("wishlist.mesdamesduc.fr", "//evil.example", ""), null);
  assert.equal(
    legacyHostRedirect("Wishlist.Mesdamesduc.fr:443", "/guide", "")?.toString(),
    "https://ohyoushouldnt.app/guide",
  );
});

test("faqPageJsonLd takes the visible questions and escapes <", () => {
  const json = faqPageJsonLd([
    { q: "Un compte ?", a: "Non, le lien suffit." },
    { q: "  ", a: "vide" },
    { q: "Balise", a: "a < b" },
  ]);
  const parsed = JSON.parse(json) as { "@type": string; mainEntity: { name: string }[] };
  assert.equal(parsed["@type"], "FAQPage");
  assert.deepEqual(
    parsed.mainEntity.map((item) => item.name),
    ["Un compte ?", "Balise"],
  );
  assert.equal(json.includes("<"), false);
});
