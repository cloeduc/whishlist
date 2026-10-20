import assert from "node:assert/strict";
import { test } from "node:test";
import { extractOgImage } from "../../src/domain/og-image";

test("extrait og:image absolue et relative", () => {
  const absolute = extractOgImage(
    `<html><head><meta property="og:image" content="https://cdn.example.com/a.jpg" /></head></html>`,
    "https://shop.example.com/p/1",
  );
  assert.equal(absolute, "https://cdn.example.com/a.jpg");
  const relative = extractOgImage(
    `<meta name="twitter:image" content="/img/b.png">`,
    "https://shop.example.com/p/1",
  );
  assert.equal(relative, "https://shop.example.com/img/b.png");
  const reverse = extractOgImage(
    `<meta content="https://cdn.example.com/c.webp" property="og:image">`,
    "https://shop.example.com/p/1",
  );
  assert.equal(reverse, "https://cdn.example.com/c.webp");
  assert.equal(extractOgImage("<html></html>", "https://shop.example.com"), null);
  const jsonLd = extractOgImage(
    `<script type="application/ld+json">{"@type":"Product","image":"/p/d.jpg"}</script>`,
    "https://shop.example.com/p/1",
  );
  assert.equal(jsonLd, "https://shop.example.com/p/d.jpg");
});
