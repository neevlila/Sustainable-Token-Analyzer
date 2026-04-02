import React from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { FileText, Zap, DollarSign, Leaf, TrendingDown, Activity, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/MetricCard";
import type { HistoryEntry } from "@/hooks/useHistory";

interface Props {
  stats: {
    totalAnalyses: number;
    totalTokensAnalyzed: number;
    totalTokensSaved: number;
    totalEnergySaved: number;
    totalCostSaved: number;
    totalCarbonSaved: number;
  };
  recentChart: { name: string; tokens: number; saved: number }[];
  carbonChart: { name: string; kg: number; saved: number }[];
  history: HistoryEntry[];
  onGoToAnalyzer: () => void;
  onClearHistory: () => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold mb-1 text-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.stroke || p.fill }}>
          {p.name}: <strong>{typeof p.value === "number" ? p.value.toLocaleString() : p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export const DashboardPanel: React.FC<Props> = ({
  stats,
  recentChart,
  carbonChart,
  history,
  onGoToAnalyzer,
  onClearHistory,
}) => {
  const hasData = stats.totalAnalyses > 0;

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Overview</h2>
          <p className="text-xs text-muted-foreground">
            {hasData
              ? `${stats.totalAnalyses} analysis session${stats.totalAnalyses > 1 ? "s" : ""} recorded`
              : "No analyses yet — start with the Analyzer tab"}
          </p>
        </div>
        {hasData && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={onClearHistory}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Clear history
          </Button>
        )}
      </div>

      {/* KPI cards — live from history */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          icon={FileText}
          title="Tokens Analyzed"
          value={hasData ? stats.totalTokensAnalyzed.toLocaleString() : "—"}
          unit={hasData ? `across ${stats.totalAnalyses} sessions` : "run an analysis first"}
          colorClass="text-blue-500"
          bgClass="bg-blue-500/10"
        />
        <MetricCard
          icon={Zap}
          title="Energy Saved"
          value={hasData ? `${(stats.totalEnergySaved * 1e6).toFixed(2)} mWh` : "—"}
          unit={hasData ? "total savings" : "run an analysis first"}
          colorClass="text-yellow-500"
          bgClass="bg-yellow-500/10"
        />
        <MetricCard
          icon={DollarSign}
          title="Cost Saved"
          value={hasData ? `${(stats.totalCostSaved * 100).toFixed(4)} ¢` : "—"}
          unit={hasData ? "total savings" : "run an analysis first"}
          colorClass="text-purple-500"
          bgClass="bg-purple-500/10"
        />
        <MetricCard
          icon={Leaf}
          title="CO₂ Reduced"
          value={hasData ? `${(stats.totalCarbonSaved * 1e6).toFixed(1)} mg` : "—"}
          unit={hasData ? "total savings" : "run an analysis first"}
          colorClass="text-green-500"
          bgClass="bg-green-500/10"
        />
      </div>

      {/* Charts — only shown when there's data */}
      {hasData ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Token usage per session */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-500" />
                Token Usage by Session
              </CardTitle>
              <CardDescription className="text-xs">
                Original vs saved tokens per run (last {recentChart.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={recentChart}>
                  <defs>
                    <linearGradient id="tokensGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="savedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={45} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone" dataKey="tokens" stroke="#6366f1"
                    fill="url(#tokensGrad)" strokeWidth={2} name="Total"
                  />
                  <Area
                    type="monotone" dataKey="saved" stroke="#22c55e"
                    fill="url(#savedGrad)" strokeWidth={2} name="Saved"
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 justify-center">
                {[["#6366f1", "Total Tokens"], ["#22c55e", "Tokens Saved"]].map(([color, label]) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="h-2 w-2 rounded-full" style={{ background: color }} />
                    {label}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Carbon per session */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Leaf className="h-4 w-4 text-green-500" />
                CO₂ Footprint per Session
              </CardTitle>
              <CardDescription className="text-xs">
                Original vs saved carbon (mg) per run (last {carbonChart.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={carbonChart} barSize={20} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={45} />
                  <Tooltip
                    content={<CustomTooltip />}
                    formatter={(v: any) => [`${v} mg`, ""]}
                  />
                  <Bar dataKey="kg"   radius={[4, 4, 0, 0]} name="Original CO₂" fill="#6366f1" />
                  <Bar dataKey="saved" radius={[4, 4, 0, 0]} name="CO₂ Saved"   fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 justify-center">
                {[["#6366f1", "Original CO₂"], ["#22c55e", "CO₂ Saved"]].map(([color, label]) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="h-2 w-2 rounded-sm" style={{ background: color }} />
                    {label}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Recent sessions table */}
      {hasData && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Sessions</CardTitle>
            <CardDescription className="text-xs">Last {Math.min(history.length, 5)} analyses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.slice(0, 5).map((entry) => {
                const pct = entry.result.savings.tokensPercent;
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-accent/40 hover:bg-accent transition-colors"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-xs font-mono text-foreground truncate">
                        {entry.result.original.prompt.slice(0, 80)}
                        {entry.result.original.prompt.length > 80 ? "…" : ""}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(entry.timestamp).toLocaleString()} ·{" "}
                        {entry.result.original.tokens} → {entry.result.optimized.tokens} tokens
                      </p>
                    </div>
                    <div
                      className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${
                        pct >= 20
                          ? "bg-green-500/10 text-green-600"
                          : pct >= 5
                          ? "bg-yellow-500/10 text-yellow-600"
                          : "bg-slate-500/10 text-slate-600"
                      }`}
                    >
                      {pct > 0 ? `−${pct}%` : "0%"}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state CTA */}
      {!hasData && (
        <Card className="border-dashed border-green-500/30 bg-green-500/5">
          <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
            <TrendingDown className="h-8 w-8 text-green-500" />
            <div>
              <p className="font-semibold">No analyses yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Analyze your first prompt to start seeing real stats here.
              </p>
            </div>
            <button
              onClick={onGoToAnalyzer}
              className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Go to Analyzer →
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
