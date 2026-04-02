import React from "react";
import { CheckCircle2, Sparkles, Lightbulb } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { AnalysisResult } from "@/types";

interface Props {
  result: AnalysisResult | null;
}

interface Tip {
  title: string;
  description: string;
  impact: "High" | "Medium" | "Low";
  savingsPct: number;
  example?: { bad: string; good: string };
}

const TIPS: Tip[] = [
  {
    title: "Remove Filler Phrases",
    description:
      "Words like 'please', 'kindly', 'could you', 'I want you to' add tokens without affecting output quality.",
    impact: "High",
    savingsPct: 28,
    example: {
      bad:  "Could you please kindly help me write a blog post?",
      good: "Write a blog post about…",
    },
  },
  {
    title: "Be Specific, Not Verbose",
    description:
      "Replace vague length requests ('very detailed', 'comprehensive') with exact word counts or bullet counts.",
    impact: "High",
    savingsPct: 32,
    example: {
      bad:  "Write a very detailed and comprehensive explanation…",
      good: "Explain in 200 words…",
    },
  },
  {
    title: "Avoid Restating Context",
    description:
      "Don't repeat information already captured in the system prompt or conversation history in every message.",
    impact: "Medium",
    savingsPct: 20,
  },
  {
    title: "Use Bullet Points in Instructions",
    description:
      "Bullet-structured prompts are parsed faster and encode constraints more efficiently than prose paragraphs.",
    impact: "Medium",
    savingsPct: 15,
  },
  {
    title: "Prefer Shorter Synonyms",
    description:
      "Replace multi-word phrases with single equivalents: 'at the current point in time' → 'now'.",
    impact: "Low",
    savingsPct: 10,
    example: {
      bad:  "At the current point in time, in light of the aforementioned…",
      good: "Now, given the above…",
    },
  },
  {
    title: "Trim Output Constraints",
    description:
      "Instead of long constraint paragraphs, use a short format directive: 'Reply in JSON. Max 150 words.'",
    impact: "High",
    savingsPct: 38,
  },
];

const IMPACT_STYLES: Record<string, string> = {
  High:   "bg-green-500/10 text-green-600 border-green-500/30",
  Medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  Low:    "bg-slate-500/10 text-slate-600 border-slate-500/30",
};

export const SuggestionsPanel: React.FC<Props> = ({ result }) => (
  <div className="space-y-6">
    {/* Header */}
    <Card className="bg-gradient-to-r from-green-500/5 to-indigo-500/5 border-green-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-green-500" />
          Optimization Suggestions
        </CardTitle>
        <CardDescription>
          Apply these techniques to systematically reduce prompt token usage and environmental cost.
        </CardDescription>
      </CardHeader>
      {result && (
        <CardContent>
          <div className="text-sm font-medium text-green-600 dark:text-green-400">
            ✓ Your last prompt was reduced by{" "}
            <strong>{result.savings.tokensPercent}%</strong> — keep going with the tips below.
          </div>
        </CardContent>
      )}
    </Card>

    {/* Tips */}
    <div className="grid grid-cols-1 gap-4">
      {(() => {
        let liveTips = [...TIPS];
        if (result && result.original.prompt !== result.optimized.prompt) {
          liveTips.unshift({
            title: "Live Analysis: Your Recent Prompt",
            description: "Here is exactly how your last prompt was optimized and shortened without losing core context.",
            impact: result.savings.tokensPercent >= 20 ? "High" : result.savings.tokensPercent >= 10 ? "Medium" : "Low",
            savingsPct: result.savings.tokensPercent,
            example: {
              bad: result.original.prompt,
              good: result.optimized.prompt,
            },
          });
        }
        return liveTips.map((tip, i) => (
          <Card key={i} className={`hover:shadow-md transition-shadow ${i === 0 && result ? 'border-green-500/40 ring-1 ring-green-500/10' : ''}`}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {i === 0 && result ? <Sparkles className="h-4 w-4 text-green-500 shrink-0" /> : <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                  {tip.title}
                </CardTitle>
                <Badge
                  variant="outline"
                  className={`text-xs font-semibold shrink-0 ${IMPACT_STYLES[tip.impact]}`}
                >
                  {tip.impact} Impact
                </Badge>
              </div>
              <CardDescription className="mt-1">{tip.description}</CardDescription>
            </CardHeader>
  
            <CardContent className="space-y-3">
              {/* Progress bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-1">Total token savings</div>
                  <Progress value={tip.savingsPct} className="h-2" />
                </div>
                <div className="text-lg font-bold text-green-600 w-12 text-right">
                  {tip.savingsPct}%
                </div>
              </div>
  
              {/* Before/after example */}
              {tip.example && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="rounded-lg p-2.5 bg-red-500/5 border border-red-500/15">
                    <div className="text-xs font-semibold text-red-500 mb-1">✗ Verbose</div>
                    <p className="text-xs text-muted-foreground font-mono">{tip.example.bad}</p>
                  </div>
                  <div className="rounded-lg p-2.5 bg-green-500/5 border border-green-500/15">
                    <div className="text-xs font-semibold text-green-600 mb-1">✓ Concise</div>
                    <p className="text-xs text-muted-foreground font-mono">{tip.example.good}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ));
      })()}
    </div>

    {/* Pro tip */}
    <Card className="border-indigo-500/20 bg-indigo-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-indigo-500" />
          Pro Tip
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Combining all high-impact techniques can reduce prompt token usage by{" "}
          <strong className="text-indigo-500">40–60%</strong>, cutting your AI energy bill and
          carbon footprint in half. Start with the highest-impact items and measure the reduction
          using the Analyzer tab.
        </p>
      </CardContent>
    </Card>
  </div>
);
