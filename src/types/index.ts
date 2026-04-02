export interface TokenMetrics {
  prompt: string;
  tokens: number;
  energy: number;       // kWh
  cost: number;         // USD
  carbonFootprint: number; // kg CO₂
}

export interface Savings {
  tokens: number;
  energy: number;
  cost: number;
  carbon: number;
  tokensPercent: number;
}

export type SustainabilityScore = "low" | "medium" | "high";

export interface AnalysisResult {
  original: TokenMetrics;
  optimized: TokenMetrics;
  score: SustainabilityScore;
  savings: Savings;
}

export interface AnalyzerState {
  loading: boolean;
  error: string | null;
  result: AnalysisResult | null;
}
