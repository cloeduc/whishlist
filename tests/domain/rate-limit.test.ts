import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clientAddress,
  isRateLimitError,
  missingIpPolicy,
  rateLimitForIp,
  resetRateLimitsForTests,
  takeToken,
} from "../../src/server/rate-limit";

test("rateLimitForIp partage le seau scope:ip et lève RateLimitError au-delà", () => {
  resetRateLimitsForTests();
  rateLimitForIp("login", "203.0.113.8", 2, 60_000);
  rateLimitForIp("login", "203.0.113.8", 2, 60_000);
  assert.throws(() => rateLimitForIp("login", "203.0.113.8", 2, 60_000), isRateLimitError);
  assert.equal(takeToken("login:203.0.113.9", 2, 60_000), true);
  rateLimitForIp("login", "203.0.113.10", 2, 60_000);
});

test("rateLimitForIp sans IP : refus en production, passage en dev", () => {
  const previous = process.env.NODE_ENV;
  try {
    (process.env as Record<string, string>).NODE_ENV = "production";
    assert.throws(() => rateLimitForIp("login", null, 2, 60_000), isRateLimitError);
    (process.env as Record<string, string>).NODE_ENV = "development";
    rateLimitForIp("login", null, 2, 60_000);
  } finally {
    (process.env as Record<string, string | undefined>).NODE_ENV = previous;
  }
});

test("takeToken respecte la fenêtre", () => {
  resetRateLimitsForTests();
  const now = 1_000_000;
  assert.equal(takeToken("t:a", 2, 1000, now), true);
  assert.equal(takeToken("t:a", 2, 1000, now + 1), true);
  assert.equal(takeToken("t:a", 2, 1000, now + 2), false);
  assert.equal(takeToken("t:a", 2, 1000, now + 1000), true);
});

test("clientAddress ignore X-Forwarded-For et préfère Cloudflare", () => {
  assert.equal(
    clientAddress({ cfConnectingIp: "203.0.113.8, 10.0.0.1", realIp: "10.0.0.1" }),
    "203.0.113.8",
  );
  assert.equal(clientAddress({ realIp: "198.51.100.4" }), "198.51.100.4");
  assert.equal(clientAddress({}), null);
  assert.equal(clientAddress({ cfConnectingIp: "unknown" }), null);
  assert.equal(clientAddress({ cfConnectingIp: "not an ip" }), null);
});

test("sans IP de confiance, la production refuse et le dev ne partage pas de seau", () => {
  assert.equal(missingIpPolicy("production"), "deny");
  assert.equal(missingIpPolicy("development"), "skip");
  assert.equal(missingIpPolicy("test"), "skip");
});
