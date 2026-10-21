import assert from "node:assert/strict";
import { test } from "node:test";
import { extractProductHints, resolveTypeId } from "../../src/domain/product-from-url";

test("extrait nom prix image depuis JSON-LD Product", () => {
  const html = `
    <html><head>
      <script type="application/ld+json">
        {"@type":"Product","name":"Mug chat","image":"/img/mug.jpg","offers":{"@type":"Offer","price":"12,90","priceCurrency":"EUR"}}
      </script>
    </head></html>`;
  const hints = extractProductHints(html, "https://shop.example.com/p/1");
  assert.equal(hints.name, "Mug chat");
  assert.equal(hints.price, "12.90");
  assert.equal(hints.imageUrl, "https://shop.example.com/img/mug.jpg");
});

test("fallback og:title et product:price:amount", () => {
  const html = `
    <meta property="og:title" content="Lampe &amp; co" />
    <meta property="product:price:amount" content="45" />
    <meta property="og:image" content="https://cdn.example.com/lampe.jpg" />
  `;
  const hints = extractProductHints(html, "https://shop.example.com/lampe");
  assert.equal(hints.name, "Lampe & co");
  assert.equal(hints.price, "45");
  assert.equal(hints.imageUrl, "https://cdn.example.com/lampe.jpg");
});

test("décode les entités HTML et lit un prix € visible", () => {
  const html = `
    <title>D&eacute;bardeur en laine m&eacute;rinos - Boutique</title>
    <meta property="og:image" content="https://shop.example.com/logo-big.webp" />
    <img src="https://shop.example.com/back/img_upload/product.jpg" />
    <p class="price">71,30 €</p>
    <button>Ajouter au panier</button>
  `;
  const hints = extractProductHints(html, "https://shop.example.com/p/1");
  assert.equal(hints.name, "Débardeur en laine mérinos - Boutique");
  assert.equal(hints.price, "71.30");
  assert.equal(hints.imageUrl, "https://shop.example.com/back/img_upload/product.jpg");
});

test("resolveTypeId mappe un label (casse ignorée)", () => {
  const types = [
    { id: "t1", label: "Cuisine" },
    { id: "t2", label: "Livres" },
  ];
  assert.equal(resolveTypeId(types, "livres"), "t2");
  assert.equal(resolveTypeId(types, "Inconnu"), null);
  assert.equal(resolveTypeId(types, "t1"), "t1");
});
