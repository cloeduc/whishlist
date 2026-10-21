import assert from "node:assert/strict";
import test from "node:test";
import { estimateLlmImpact } from "../../src/domain/llm-impact";

test("estimateLlmImpact scale avec les tokens", () => {
  const zero = estimateLlmImpact(0);
  assert.equal(zero.totalTokens, 0);
  assert.equal(zero.co2Grams, 0);
  assert.equal(zero.beefGrams, 0);

  const impact = estimateLlmImpact(2000);
  assert.equal(impact.totalTokens, 2000);
  assert.ok(impact.co2Grams > 0);
  assert.ok(impact.beefGrams > 0);
});
