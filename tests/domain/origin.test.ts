import assert from "node:assert/strict";
import { test } from "node:test";
import {
  normalizeAppOrigin,
  originFromEnv,
  originFromHeaders,
} from "../../src/auth/origin";

test("normalizeAppOrigin accepte http(s) host only", () => {
  assert.equal(normalizeAppOrigin("https://ohyoushouldnt.app"), "https://ohyoushouldnt.app");
  assert.equal(normalizeAppOrigin("https://ohyoushouldnt.app/"), "https://ohyoushouldnt.app");
  assert.equal(normalizeAppOrigin("http://localhost:3000"), "http://localhost:3000");
  assert.equal(normalizeAppOrigin("https://example.com/path"), null);
  assert.equal(normalizeAppOrigin("ftp://x"), null);
  assert.equal(normalizeAppOrigin("https://user:pass@evil.com"), null);
});

test("originFromEnv lit APP_ORIGIN puis WHISHLIST_APP_ORIGIN", () => {
  assert.equal(originFromEnv({ APP_ORIGIN: "https://a.example/" }), "https://a.example");
  assert.equal(
    originFromEnv({ WHISHLIST_APP_ORIGIN: "https://b.example" }),
    "https://b.example",
  );
  assert.equal(
    originFromEnv({ APP_ORIGIN: "https://a.example", WHISHLIST_APP_ORIGIN: "https://b.example" }),
    "https://a.example",
  );
  assert.equal(originFromEnv({}), null);
});

test("originFromHeaders prend le premier hop Forwarded", () => {
  assert.equal(
    originFromHeaders({
      host: "internal:3000",
      forwardedHost: "ohyoushouldnt.app, evil.com",
      forwardedProto: "https, http",
    }),
    "https://ohyoushouldnt.app",
  );
});
