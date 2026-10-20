import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assertSafeFetchUrl,
  isBlockedIp,
  safeHttpGet,
  type DnsLookup,
} from "../../src/domain/safe-http";

test("bloque les IP privées / metadata / loopback", () => {
  for (const ip of [
    "127.0.0.1",
    "10.0.0.5",
    "192.168.1.1",
    "172.16.0.1",
    "172.31.255.255",
    "169.254.169.254",
    "100.64.1.1",
    "0.0.0.0",
    "::1",
    "fc00::1",
    "fe80::1",
    "::ffff:127.0.0.1",
  ]) {
    assert.equal(isBlockedIp(ip), true, ip);
  }
  assert.equal(isBlockedIp("8.8.8.8"), false);
  assert.equal(isBlockedIp("1.1.1.1"), false);
});

test("assertSafeFetchUrl refuse localhost et ports exotiques", async () => {
  await assert.rejects(() => assertSafeFetchUrl("http://localhost/x"), /urlHostBlocked|urlInvalid/);
  await assert.rejects(() => assertSafeFetchUrl("http://127.0.0.1/"), /urlHostBlocked/);
  await assert.rejects(() => assertSafeFetchUrl("http://example.com:8080/"), /urlPortBlocked/);
  await assert.rejects(() => assertSafeFetchUrl("file:///etc/passwd"), /urlInvalid/);
});

test("assertSafeFetchUrl refuse DNS vers IP privée", async () => {
  const lookup: DnsLookup = async () => [{ address: "10.1.2.3", family: 4 }];
  await assert.rejects(
    () => assertSafeFetchUrl("https://evil.example/path", lookup),
    /urlHostBlocked/,
  );
});

test("assertSafeFetchUrl accepte un host public", async () => {
  const lookup: DnsLookup = async () => [{ address: "93.184.216.34", family: 4 }];
  const url = await assertSafeFetchUrl("https://example.com/item", lookup);
  assert.equal(url.hostname, "example.com");
});

test("safeHttpGet refuse un redirect vers IP privée", async () => {
  const lookup: DnsLookup = async (hostname) => {
    if (hostname === "shop.example") return [{ address: "93.184.216.34", family: 4 }];
    if (hostname === "internal.local") return [{ address: "10.0.0.9", family: 4 }];
    return [{ address: "1.1.1.1", family: 4 }];
  };
  const fetchImpl: typeof fetch = async (input) => {
    const href = String(input);
    if (href.includes("shop.example")) {
      return new Response(null, {
        status: 302,
        headers: { location: "http://internal.local/secret" },
      });
    }
    return new Response("nope", { status: 200 });
  };
  const result = await safeHttpGet("https://shop.example/p", { lookup, fetchImpl });
  assert.equal(result, null);
});

test("safeHttpGet suit un redirect public", async () => {
  const lookup: DnsLookup = async () => [{ address: "93.184.216.34", family: 4 }];
  let hits = 0;
  const fetchImpl: typeof fetch = async (input) => {
    hits += 1;
    const href = String(input);
    if (href.includes("/a")) {
      return new Response(null, {
        status: 301,
        headers: { location: "https://cdn.example/b" },
      });
    }
    return new Response("<html>ok</html>", {
      status: 200,
      headers: { "content-type": "text/html" },
    });
  };
  const result = await safeHttpGet("https://shop.example/a", { lookup, fetchImpl });
  assert.ok(result);
  assert.equal(result!.finalUrl, "https://cdn.example/b");
  assert.equal(await result!.response.text(), "<html>ok</html>");
  assert.equal(hits, 2);
});
