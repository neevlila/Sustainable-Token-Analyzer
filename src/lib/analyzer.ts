// Shared analysis logic — runs in the browser (no backend needed)

export const ENERGY_PER_1K_KWH  = 0.0003;   // kWh per 1K tokens
export const COST_PER_1K_USD    = 0.0004;   // USD per 1K input tokens
export const CARBON_KG_PER_KWH  = 0.386;    // kg CO₂ / kWh (global avg)

export function estimateTokens(text: string): number {
  // GPT-style approximation: ~4 chars per token
  return Math.max(1, Math.ceil(text.length / 4));
}

export function computeMetrics(tokenCount: number) {
  const energy          = (tokenCount / 1000) * ENERGY_PER_1K_KWH;
  const cost            = (tokenCount / 1000) * COST_PER_1K_USD;
  const carbonFootprint = energy * CARBON_KG_PER_KWH;
  return { tokens: tokenCount, energy, cost, carbonFootprint };
}

// ── Rule-based optimizer (client-side fallback) ───────────────────────────────

const FILLER_REGEXES = [
  /\b(please|kindly)\b[\s,]*/gi,
  /\b(could you|would you|can you|will you)\s+/gi,
  /\b(I want you to|I need you to|I['']d like you to|I would like you to)\s+/gi,
  /\b(very|really|extremely|quite|rather|fairly|somewhat)\s+/gi,
  /\b(comprehensive|thorough|extensive|complete|detailed)\s+/gi,
  /\b(in light of the aforementioned|at the current point in time)\b/gi,
  /\b(as mentioned above|as stated above|as noted above)\b[\s,]*/gi,
  /\b(in order to)\b/gi,
  /\b(due to the fact that)\b/gi,
  /\b(at this point in time)\b/gi,
];

export function clientSideOptimize(text: string): string {
  let result = text;
  for (const re of FILLER_REGEXES) {
    result = result.replace(re, ' ');
  }
  // Collapse whitespace, trim space before punctuation
  result = result
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,!?;:])/g, '$1')
    .trim();
  return result.length > 10 ? result : text;   // sanity guard: never return near-empty
}

export function sustainabilityScore(
  originalTokens: number,
  optimizedTokens: number
): 'low' | 'medium' | 'high' {
  const reduction = (originalTokens - optimizedTokens) / originalTokens;
  if (reduction >= 0.35) return 'high';
  if (reduction >= 0.12) return 'medium';
  return 'low';
}

export function buildResult(originalPrompt: string, optimizedPrompt: string) {
  const origMetrics = { prompt: originalPrompt, ...computeMetrics(estimateTokens(originalPrompt)) };
  const optMetrics  = { prompt: optimizedPrompt, ...computeMetrics(estimateTokens(optimizedPrompt)) };
  const score       = sustainabilityScore(origMetrics.tokens, optMetrics.tokens);

  const rawPct = origMetrics.tokens > 0
    ? ((origMetrics.tokens - optMetrics.tokens) / origMetrics.tokens) * 100
    : 0;

  return {
    original:  origMetrics,
    optimized: optMetrics,
    score,
    savings: {
      tokens:        origMetrics.tokens        - optMetrics.tokens,
      energy:        origMetrics.energy        - optMetrics.energy,
      cost:          origMetrics.cost          - optMetrics.cost,
      carbon:        origMetrics.carbonFootprint - optMetrics.carbonFootprint,
      tokensPercent: Number(rawPct.toFixed(1)),
    },
  };
}
