/** Token usage returned by the LLM provider. */
export type LlmUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

/**
 * Illustrative orders of magnitude (not an LCA).
 * Deliberately transparent assumptions, for a small flash / mini type model.
 */
export const LLM_IMPACT = {
  /** Estimated grams of CO₂e per 1,000 tokens. */
  co2GramsPer1kTokens: 0.5,
  /** Grams of CO₂e per 1 g of beef (LCA order of magnitude). */
  co2GramsPerBeefGram: 27,
} as const;

export type LlmImpact = {
  totalTokens: number;
  co2Grams: number;
  beefGrams: number;
};

export function estimateLlmImpact(totalTokens: number): LlmImpact {
  const tokens = Math.max(0, Math.round(totalTokens));
  const units = tokens / 1000;
  const co2Grams = units * LLM_IMPACT.co2GramsPer1kTokens;
  const beefGrams = co2Grams / LLM_IMPACT.co2GramsPerBeefGram;
  return {
    totalTokens: tokens,
    co2Grams,
    beefGrams,
  };
}

export function emptyUsage(): LlmUsage {
  return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
}

export function sumUsage(a: LlmUsage, b: LlmUsage): LlmUsage {
  return {
    promptTokens: a.promptTokens + b.promptTokens,
    completionTokens: a.completionTokens + b.completionTokens,
    totalTokens: a.totalTokens + b.totalTokens,
  };
}
