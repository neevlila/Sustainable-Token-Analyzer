import type { Handler, HandlerEvent } from "@netlify/functions";

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || "";
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
const MODEL = "qwen/qwen2.5-72b-instruct";

// ── Pricing & energy constants ────────────────────────────────────────────────
const ENERGY_PER_1K_TOKENS_KWH = 0.0003;   // kWh per 1K tokens (realistic estimate)
const COST_PER_1K_INPUT_TOKENS  = 0.0004;   // USD
const CARBON_KG_PER_KWH         = 0.386;    // global average grid intensity

function estimateTokens(text: string): number {
  // GPT-style approximation: ~4 chars per token
  return Math.ceil(text.length / 4);
}

function computeMetrics(tokenCount: number) {
  const energy        = (tokenCount / 1000) * ENERGY_PER_1K_TOKENS_KWH;
  const cost          = (tokenCount / 1000) * COST_PER_1K_INPUT_TOKENS;
  const carbonFootprint = energy * CARBON_KG_PER_KWH;
  return { tokens: tokenCount, energy, cost, carbonFootprint };
}

function sustainabilityScore(original: number, optimized: number): "low" | "medium" | "high" {
  const reduction = (original - optimized) / original;
  if (reduction >= 0.35) return "high";
  if (reduction >= 0.15) return "medium";
  return "low";
}

const handler: Handler = async (event: HandlerEvent) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let prompt: string;
  try {
    const body = JSON.parse(event.body || "{}");
    prompt = (body.prompt || "").trim();
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  if (!prompt) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Prompt is required" }) };
  }

  const originalMetrics = computeMetrics(estimateTokens(prompt));

  // ── Call NVIDIA / Qwen API ─────────────────────────────────────────────────
  const systemInstruction = `You are a prompt optimization assistant focused on sustainability and efficiency.
Your task: rewrite the user's prompt to be shorter, clearer, and use fewer tokens while preserving full intent.
Rules:
  1. Remove redundant words, filler phrases, and repetition.
  2. Use active voice and concise phrasing.
  3. Do NOT add explanations — return ONLY the optimized prompt text.
  4. Do NOT wrap in quotes.`;

  let optimizedPrompt = prompt;

  if (NVIDIA_API_KEY) {
    try {
      const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NVIDIA_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user",   content: prompt },
          ],
          max_tokens: 1024,
          temperature: 0.3,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        optimizedPrompt = data.choices?.[0]?.message?.content?.trim() || prompt;
      }
    } catch (err) {
      console.error("NVIDIA API error:", err);
      // fall through — return rule-based fallback
    }
  } else {
    // Offline fallback: naive rule-based optimizer
    optimizedPrompt = prompt
      .replace(/\b(please|kindly|could you|would you|I want you to|I need you to)\b/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  const optimizedMetrics = computeMetrics(estimateTokens(optimizedPrompt));
  const score = sustainabilityScore(originalMetrics.tokens, optimizedMetrics.tokens);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      original: {
        prompt,
        ...originalMetrics,
      },
      optimized: {
        prompt: optimizedPrompt,
        ...optimizedMetrics,
      },
      score,
      savings: {
        tokens:  originalMetrics.tokens  - optimizedMetrics.tokens,
        energy:  originalMetrics.energy  - optimizedMetrics.energy,
        cost:    originalMetrics.cost    - optimizedMetrics.cost,
        carbon:  originalMetrics.carbonFootprint - optimizedMetrics.carbonFootprint,
        tokensPercent: Number(
          (((originalMetrics.tokens - optimizedMetrics.tokens) / originalMetrics.tokens) * 100).toFixed(1)
        ),
      },
    }),
  };
};

export { handler };
