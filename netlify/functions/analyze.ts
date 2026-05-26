import type { Handler, HandlerEvent } from "@netlify/functions";

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || "";
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
const MODEL = "qwen/qwen2.5-72b-instruct";
const MAX_PROMPT_LENGTH = 5000;
const API_TOKEN = process.env.API_TOKEN || "";
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "http://localhost:5173";

// Request counter for rate limiting (simple in-memory, use Redis in production)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 100;
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute

function getRateLimitKey(clientIp: string): string {
  return clientIp;
}

function checkRateLimit(clientIp: string): boolean {
  const key = getRateLimitKey(clientIp);
  const now = Date.now();
  const record = requestCounts.get(key);

  if (!record || now > record.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

// ── Pricing & energy constants ────────────────────────────────────────────────
const ENERGY_PER_1K_TOKENS_KWH = 0.0003;
const COST_PER_1K_INPUT_TOKENS = 0.0004;
const CARBON_KG_PER_KWH = 0.386;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function computeMetrics(tokenCount: number) {
  const energy = (tokenCount / 1000) * ENERGY_PER_1K_TOKENS_KWH;
  const cost = (tokenCount / 1000) * COST_PER_1K_INPUT_TOKENS;
  const carbonFootprint = energy * CARBON_KG_PER_KWH;
  return { tokens: tokenCount, energy, cost, carbonFootprint };
}

function sustainabilityScore(original: number, optimized: number): "low" | "medium" | "high" {
  const reduction = (original - optimized) / original;
  if (reduction >= 0.35) return "high";
  if (reduction >= 0.15) return "medium";
  return "low";
}

function getClientIp(event: HandlerEvent): string {
  return event.headers["client-ip"] || event.headers["x-forwarded-for"]?.split(",")[0] || "unknown";
}

function getCorsHeaders(origin: string | undefined): Record<string, string> {
  const isAllowed = origin === ALLOWED_ORIGIN || (process.env.NODE_ENV !== "production");
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin || ALLOWED_ORIGIN : ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json",
  };
}

const handler: Handler = async (event: HandlerEvent) => {
  const origin = event.headers.origin;
  const headers = getCorsHeaders(origin);

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  // Rate limiting
  const clientIp = getClientIp(event);
  if (!checkRateLimit(clientIp)) {
    return {
      statusCode: 429,
      headers,
      body: JSON.stringify({ error: "Rate limit exceeded. Max 100 requests per minute." }),
    };
  }

  // Authentication check
  const authHeader = event.headers.authorization;
  if (API_TOKEN && (!authHeader || !authHeader.startsWith("Bearer "))) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: "Unauthorized: Missing or invalid Authorization header" }),
    };
  }

  if (API_TOKEN) {
    const token = authHeader!.slice(7);
    if (token !== API_TOKEN) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: "Forbidden: Invalid API token" }),
      };
    }
  }

  // Parse and validate input
  let prompt: string;
  try {
    const body = JSON.parse(event.body || "{}");
    prompt = (body.prompt || "").trim();
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid JSON body" })
    };
  }

  // Validate prompt
  if (!prompt) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Prompt is required" })
    };
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: `Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters`
      }),
    };
  }

  // Sanitize prompt (remove null bytes and excessive control characters)
  const sanitizedPrompt = prompt
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (sanitizedPrompt.length === 0) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Prompt contains only invalid characters" }),
    };
  }

  const originalMetrics = computeMetrics(estimateTokens(sanitizedPrompt));

  // ── Call NVIDIA API with proper error handling ─────────────────────────────
  const systemInstruction = `You are a prompt optimization assistant focused on sustainability and efficiency.
Your task: rewrite the user's prompt to be shorter, clearer, and use fewer tokens while preserving full intent.
Rules:
  1. Remove redundant words, filler phrases, and repetition.
  2. Use active voice and concise phrasing.
  3. Do NOT add explanations — return ONLY the optimized prompt text.
  4. Do NOT wrap in quotes.`;

  let optimizedPrompt = sanitizedPrompt;
  let usedAiOptimization = false;

  if (NVIDIA_API_KEY) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

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
            { role: "user", content: sanitizedPrompt },
          ],
          max_tokens: 1024,
          temperature: 0.3,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        try {
          const data = await response.json();
          const content = data?.choices?.[0]?.message?.content;

          if (typeof content === "string" && content.length > 0 && content.length <= MAX_PROMPT_LENGTH) {
            optimizedPrompt = content.trim();
            usedAiOptimization = true;
          }
        } catch (parseErr) {
          console.error("[ANALYZE] Failed to parse NVIDIA response:", parseErr);
        }
      } else if (response.status === 401 || response.status === 403) {
        console.error("[ANALYZE] NVIDIA API authentication failed:", response.status);
      } else {
        console.error("[ANALYZE] NVIDIA API returned:", response.status, response.statusText);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        console.error("[ANALYZE] NVIDIA API request timeout");
      } else {
        console.error("[ANALYZE] NVIDIA API error:", err);
      }
    }
  }

  // Apply rule-based fallback if AI optimization wasn't used
  if (!usedAiOptimization) {
    optimizedPrompt = sanitizedPrompt
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
        prompt: sanitizedPrompt,
        ...originalMetrics,
      },
      optimized: {
        prompt: optimizedPrompt,
        ...optimizedMetrics,
      },
      score,
      savings: {
        tokens: originalMetrics.tokens - optimizedMetrics.tokens,
        energy: originalMetrics.energy - optimizedMetrics.energy,
        cost: originalMetrics.cost - optimizedMetrics.cost,
        carbon: originalMetrics.carbonFootprint - optimizedMetrics.carbonFootprint,
        tokensPercent: Number(
          (((originalMetrics.tokens - optimizedMetrics.tokens) / originalMetrics.tokens) * 100).toFixed(1)
        ),
      },
      optimizationMethod: usedAiOptimization ? "ai" : "heuristic",
    }),
  };
};

export { handler };
