import assert from "node:assert/strict";
import { test } from "node:test";
import { resetRateLimitsForTests, takeToken } from "../../src/server/rate-limit";

test("takeToken respecte la fenêtre", () => {
  resetRateLimitsForTests();
  const now = 1_000_000;
  assert.equal(takeToken("t:a", 2, 1000, now), true);
  assert.equal(takeToken("t:a", 2, 1000, now + 1), true);
  assert.equal(takeToken("t:a", 2, 1000, now + 2), false);
  assert.equal(takeToken("t:a", 2, 1000, now + 1000), true);
});
