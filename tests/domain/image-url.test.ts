import assert from "node:assert/strict";
import { test } from "node:test";
import { probeImage, sameAddress } from "../../src/domain/image-url";
import type { DnsLookup } from "../../src/domain/safe-http";

const lookup: DnsLookup = async () => [{ address: "93.184.216.34", family: 4 }];

function serving(status: number, contentType: string | null): typeof fetch {
  return (async () =>
    // Bytes, not a string: a string body would add a text/plain type by itself.
    new Response(new Uint8Array([1, 2, 3]), {
      status,
      headers: contentType ? { "content-type": contentType } : {},
    })) as typeof fetch;
}

test("sameAddress ignores the fragment and a trailing slash", () => {
  assert.equal(sameAddress("https://shop.example/p-1.html", "https://shop.example/p-1.html#top"), true);
  assert.equal(sameAddress("https://shop.example/book/", "https://shop.example/book"), true);
  assert.equal(sameAddress("https://shop.example/p-1.html", "https://cdn.shop.example/p-1.jpg"), false);
  assert.equal(sameAddress("not a url", "not a url"), false);
  assert.equal(sameAddress(null, "https://shop.example/"), false);
});

test("probeImage: an image, a page or a missing file", async () => {
  const url = "https://cdn.shop.example/p-1.jpg";
  assert.equal(await probeImage(url, { lookup, fetchImpl: serving(200, "image/jpeg") }), "image");
  assert.equal(await probeImage(url, { lookup, fetchImpl: serving(200, "text/html; charset=utf-8") }), "notImage");
  assert.equal(await probeImage(url, { lookup, fetchImpl: serving(404, "text/html") }), "notImage");
  assert.equal(await probeImage(url, { lookup, fetchImpl: serving(410, null) }), "notImage");
});

test("probeImage keeps what it cannot tell: robots refused, server error, no type, network failure", async () => {
  const url = "https://cdn.shop.example/p-1.jpg";
  assert.equal(await probeImage(url, { lookup, fetchImpl: serving(403, "text/html") }), "unknown");
  assert.equal(await probeImage(url, { lookup, fetchImpl: serving(503, "text/html") }), "unknown");
  assert.equal(await probeImage(url, { lookup, fetchImpl: serving(200, null) }), "unknown");
  const failing = (async () => {
    throw new Error("network down");
  }) as typeof fetch;
  assert.equal(await probeImage(url, { lookup, fetchImpl: failing }), "unknown");
});

test("probeImage never reaches a private address", async () => {
  let called = false;
  const spy = (async () => {
    called = true;
    return new Response("", { headers: { "content-type": "image/png" } });
  }) as typeof fetch;
  assert.equal(await probeImage("http://127.0.0.1/a.png", { fetchImpl: spy }), "unknown");
  assert.equal(called, false);
});
