import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend
} from "recharts";
import { AlertCircle, BarChart3, Activity, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AnalysisResult } from "@/types";

interface Props {
  result: AnalysisResult | null;
  onGoToAnalyzer: () => void;
}

const COLORS = {
  original: "#6366f1",
  optimized: "#22c55e",
};

// Custom tooltip for recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill }}>
          {p.name}: <strong>{typeof p.value === "number" ? p.value.toLocaleString() : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export const ComparisonPanel: React.FC<Props> = ({ result, onGoToAnalyzer }) => {
  if (!result) {
    return (
      <Card>
        <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
          <div className="p-4 rounded-full bg-muted">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">No data yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Analyze a prompt first to view comparison charts here.
            </p>
          </div>
          <Button variant="outline" onClick={onGoToAnalyzer}>
            Go to Analyzer
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { original, optimized } = result;

  const tokenData = [
    { name: "Original",   Tokens: original.tokens },
    { name: "Optimized",  Tokens: optimized.tokens },
  ];

  const energyData = [
    { name: "Original",  "Energy (Wh)": Number((original.energy * 1000).toFixed(4)) },
    { name: "Optimized", "Energy (Wh)": Number((optimized.energy * 1000).toFixed(4)) },
  ];

  const costData = [
    { name: "Original",  "Cost (¢)": Number((original.cost * 100).toFixed(4)) },
    { name: "Optimized", "Cost (¢)": Number((optimized.cost * 100).toFixed(4)) },
  ];

  const co2Data = [
    { name: "Original",  "CO₂ (mg)": Number((original.carbonFootprint * 1e6).toFixed(2)) },
    { name: "Optimized", "CO₂ (mg)": Number((optimized.carbonFootprint * 1e6).toFixed(2)) },
  ];

  const charts = [
    { title: "Token Count",    desc: "Tokens consumed per request",        dataKey: "Tokens",      data: tokenData,  suffix: "" },
    { title: "Energy Usage",   desc: "Energy in watt-hours per request",   dataKey: "Energy (Wh)", data: energyData, suffix: " Wh" },
    { title: "Cost",           desc: "Cost in US cents per request",        dataKey: "Cost (¢)",    data: costData,   suffix: "¢" },
    { title: "CO₂ Footprint",  desc: "Carbon in milligrams per request",   dataKey: "CO₂ (mg)",   data: co2Data,    suffix: " mg" },
  ];

  const savings = result.savings;

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Tokens Saved",   val: `${savings.tokensPercent}%` },
          { label: "Energy Saved",   val: `${((savings.energy / original.energy) * 100).toFixed(1)}%` },
          { label: "Cost Saved",     val: `${((savings.cost / original.cost) * 100).toFixed(1)}%` },
          { label: "Carbon Reduced", val: `${((savings.carbon / original.carbonFootprint) * 100).toFixed(1)}%` },
        ].map(({ label, val }) => (
          <div key={label} className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{val}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* 2×2 chart grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {charts.map(({ title, desc, dataKey, data, suffix }) => (
          <Card key={title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-green-500" />
                {title}
              </CardTitle>
              <CardDescription className="text-xs">{desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data} barSize={48}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}${suffix}`} width={55} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
                    <Cell fill={COLORS.original} />
                    <Cell fill={COLORS.optimized} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 justify-center">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.original }} />
                  Original
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.optimized }} />
                  Optimized
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Side-by-side text */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Original Prompt</CardTitle>
            <CardDescription className="text-xs">{original.tokens} tokens</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20 font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-40 overflow-auto">
              {original.prompt}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              Optimized Prompt
              <Activity className="h-3.5 w-3.5 text-green-500" />
            </CardTitle>
            <CardDescription className="text-xs">{optimized.tokens} tokens</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20 font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-40 overflow-auto">
              {optimized.prompt}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
