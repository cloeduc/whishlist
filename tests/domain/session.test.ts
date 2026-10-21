import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { readSession, SESSION_TTL_SEC, signSession } from "../../src/auth/session";

const secret = "test-session-secret-at-least-32-chars!!";

test("sign/read round-trip", () => {
  const now = Date.parse("2026-06-01T12:00:00.000Z");
  const token = signSession("user_abc", secret, now, 2);
  assert.deepEqual(readSession(token, secret, now), { userId: "user_abc", sessionVersion: 2 });
  assert.equal(token.split(".").length, 5);
});

test("jeton legacy sans version = version 0", () => {
  const now = Date.parse("2026-06-01T12:00:00.000Z");
  const iat = Math.floor(now / 1000);
  const exp = iat + SESSION_TTL_SEC;
  const body = `user_abc.${iat}.${exp}`;
  const mac = createHmac("sha256", secret).update(body).digest("base64url");
  assert.deepEqual(readSession(`${body}.${mac}`, secret, now), {
    userId: "user_abc",
    sessionVersion: 0,
  });
});

test("refuse token expiré", () => {
  const issued = Date.parse("2026-01-01T00:00:00.000Z");
  const token = signSession("u1", secret, issued, 0);
  const afterTtl = issued + (SESSION_TTL_SEC + 1) * 1000;
  assert.equal(readSession(token, secret, afterTtl), null);
});

test("refuse MAC altéré / legacy userId.mac", () => {
  const now = Date.parse("2026-06-01T12:00:00.000Z");
  const token = signSession("u1", secret, now, 1);
  const parts = token.split(".");
  parts[4] = "tampered";
  assert.equal(readSession(parts.join("."), secret, now), null);
  assert.equal(readSession("u1.legacyMacOnly", secret, now), null);
  assert.equal(readSession(signSession("u1", "other-secret-xxxxxxxxxxxxxx", now, 1), secret, now), null);
});

test("refuse extension manuelle de exp", () => {
  const now = Date.parse("2026-06-01T12:00:00.000Z");
  const token = signSession("u1", secret, now, 3);
  const [userId, version, iat] = token.split(".");
  const body = `${userId}.${version}.${iat}.${Number(iat) + SESSION_TTL_SEC * 2}`;
  const mac = createHmac("sha256", secret).update(body).digest("base64url");
  assert.equal(readSession(`${body}.${mac}`, secret, now), null);
});
