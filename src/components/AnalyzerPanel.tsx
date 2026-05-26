import React, { useState, useMemo } from "react";
import { Activity, Loader2, AlertCircle, X, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { buildResult, clientSideOptimize } from "@/lib/analyzer";
import type { AnalysisResult } from "@/types";

interface Props {
  loading: boolean;
  error: string | null;
  onAnalyze: (prompt: string) => void;
  onReset: () => void;
}

const EXAMPLE_PROMPTS = [
  "Please could you kindly help me write a very detailed and comprehensive blog post about the various ways in which artificial intelligence technology is being used in modern healthcare systems around the world today?",
  "I would like you to please generate a list of the top 10 most important things I should know about machine learning, explaining each one in great detail.",
  "Can you write a Python function that sorts a list?",
];

export const AnalyzerPanel: React.FC<Props> = ({ loading, error, onAnalyze, onReset }) => {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = () => {
    if (prompt.trim() && !loading) onAnalyze(prompt);
  };

  const handleClear = () => {
    setPrompt("");
    onReset();
  };

  const tokenEstimate = Math.ceil(prompt.length / 4);

  // Real-time client-side analysis as user types
  const liveResult: AnalysisResult | null = useMemo(() => {
    if (!prompt.trim()) return null;
    const optimized = clientSideOptimize(prompt);
    return buildResult(prompt, optimized);
  }, [prompt]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500" />
            Prompt Analyzer
          </CardTitle>
          <CardDescription>
            Enter your AI prompt below — we'll optimize it for efficiency and measure its environmental impact.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Textarea */}
          <div className="relative">
            <Textarea
              id="prompt-input"
              placeholder="Paste your prompt here…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={7}
              className="resize-none pr-10 font-mono text-sm leading-relaxed"
              disabled={loading}
            />
            {prompt && (
              <button
                onClick={handleClear}
                className="absolute top-2 right-2 p-1 rounded-md hover:bg-accent text-muted-foreground"
                title="Clear"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Token estimate & actions */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              ~{tokenEstimate.toLocaleString()} tokens estimated
            </span>
            <div className="flex gap-2">
              {prompt && (
                <Button variant="outline" size="sm" onClick={handleClear} disabled={loading}>
                  Clear
                </Button>
              )}
              <Button
                id="analyze-btn"
                onClick={handleSubmit}
                disabled={!prompt.trim() || loading}
                className="bg-green-600 hover:bg-green-700 text-white"
                title={liveResult ? "Get advanced AI optimization" : "Start typing to see live estimates"}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    {liveResult ? "Optimize" : "Analyze"}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-600">Analysis Failed</p>
                <p className="text-xs text-red-500 mt-0.5">{error}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Example prompts */}
      {!loading && (
        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Try an example
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {EXAMPLE_PROMPTS.map((ex, i) => (
              <button
                key={i}
                onClick={() => setPrompt(ex)}
                className="w-full text-left text-xs p-3 rounded-md bg-accent hover:bg-accent/70 text-muted-foreground hover:text-foreground transition-colors leading-relaxed"
              >
                {ex}
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
