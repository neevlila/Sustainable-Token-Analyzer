import React from "react";
import { FileText, Zap, DollarSign, Leaf, CheckCircle2, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/MetricCard";
import type { AnalysisResult, SustainabilityScore } from "@/types";

interface Props {
  result: AnalysisResult;
}

const SCORE_CONFIG: Record<SustainabilityScore, { label: string; className: string }> = {
  high:   { label: "High Savings",   className: "bg-green-500/10 text-green-600 border-green-500/30" },
  medium: { label: "Medium Savings", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" },
  low:    { label: "Low Savings",    className: "bg-red-500/10 text-red-600 border-red-500/30" },
};

export const ResultsPanel: React.FC<Props> = ({ result }) => {
  const { original, optimized, score, savings } = result;
  const scoreConfig = SCORE_CONFIG[score];
  const pct = savings.tokensPercent;

  return (
    <div className="space-y-6">
      {/* Score banner */}
      <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10">
            <TrendingDown className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-sm font-semibold">Optimization Complete</p>
            <p className="text-xs text-muted-foreground">
              Reduced by <strong>{pct}%</strong> tokens with AI rewriting
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={`${scoreConfig.className} font-semibold text-xs px-3 py-1`}
        >
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
          {scoreConfig.label}
        </Badge>
      </div>

      {/* Original metrics */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Original Prompt
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard icon={FileText}   title="Tokens"  value={original.tokens.toLocaleString()}                       unit="tokens"  colorClass="text-blue-500"   bgClass="bg-blue-500/10" />
          <MetricCard icon={Zap}        title="Energy"  value={(original.energy * 1e6).toFixed(2)}                     unit="mWh"     colorClass="text-yellow-500" bgClass="bg-yellow-500/10" />
          <MetricCard icon={DollarSign} title="Cost"    value={(original.cost * 100).toFixed(4)}                       unit="¢"       colorClass="text-purple-500" bgClass="bg-purple-500/10" />
          <MetricCard icon={Leaf}       title="Carbon"  value={(original.carbonFootprint * 1e6).toFixed(2)}            unit="mg CO₂"  colorClass="text-green-500"  bgClass="bg-green-500/10" />
        </div>
      </div>

      {/* Optimized metrics */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Optimized Prompt
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard icon={FileText}   title="Tokens" value={optimized.tokens.toLocaleString()}     unit="tokens"  colorClass="text-blue-500"   bgClass="bg-blue-500/10"   delta={savings.tokensPercent > 0 ? `−${savings.tokensPercent}%` : '0%'} deltaPositive />
          <MetricCard icon={Zap}        title="Energy" value={(optimized.energy * 1e6).toFixed(2)}   unit="mWh"     colorClass="text-yellow-500" bgClass="bg-yellow-500/10" delta={savings.energy > 0 ? `−${((savings.energy/original.energy)*100).toFixed(1)}%` : '0%'} deltaPositive />
          <MetricCard icon={DollarSign} title="Cost"   value={(optimized.cost * 100).toFixed(4)}     unit="¢"       colorClass="text-purple-500" bgClass="bg-purple-500/10" delta={savings.cost > 0 ? `−${((savings.cost/original.cost)*100).toFixed(1)}%` : '0%'} deltaPositive />
          <MetricCard icon={Leaf}       title="Carbon" value={(optimized.carbonFootprint * 1e6).toFixed(2)} unit="mg CO₂" colorClass="text-green-500" bgClass="bg-green-500/10" delta={savings.carbon > 0 ? `−${((savings.carbon/original.carbonFootprint)*100).toFixed(1)}%` : '0%'} deltaPositive />
        </div>
      </div>

      {/* Optimized prompt text */}
      <Card className="border-green-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Optimized Prompt
          </CardTitle>
          <CardDescription>AI-rewritten version — ready to copy and use</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20 font-mono text-sm leading-relaxed whitespace-pre-wrap">
            {optimized.prompt}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
