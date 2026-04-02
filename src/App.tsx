import React, { useState } from "react";
import { Leaf, Menu, X } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { AnalyzerPanel } from "@/components/AnalyzerPanel";
import { ResultsPanel } from "@/components/ResultsPanel";
import { ComparisonPanel } from "@/components/ComparisonPanel";
import { DashboardPanel } from "@/components/DashboardPanel";
import { SuggestionsPanel } from "@/components/SuggestionsPanel";
import { useAnalyzer } from "@/hooks/useAnalyzer";
import { useHistory } from "@/hooks/useHistory";

type Tab = "dashboard" | "analyzer" | "comparison" | "suggestions";

const TAB_LABELS: Record<Tab, string> = {
  dashboard:   "Dashboard",
  analyzer:    "Analyzer",
  comparison:  "Comparison",
  suggestions: "Suggestions",
};

function App() {
  const [activeTab, setActiveTab]   = useState<Tab>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  const { loading, error, result, analyze, reset } = useAnalyzer();
  const { stats, recentChart, carbonChart, history, addEntry, clearHistory } = useHistory();

  const navigateTo = (tab: Tab) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  const handleAnalyze = async (prompt: string) => {
    await analyze(prompt);
    // After analyze() resolves, result is in state — but we need the latest value.
    // We use a small trick: read from the hook again via the setter callback pattern.
    // Instead, we pass a callback into useAnalyzer. Simpler: just navigate & let
    // ResultsPanel read from state. The addEntry happens via useEffect in parent.
    navigateTo("comparison");
  };

  // ── Persist each new result into history ───────────────────────────────────
  // We use a ref-based approach: watch result and add when it changes.
  const prevResultRef = React.useRef<typeof result>(null);
  React.useEffect(() => {
    if (result && result !== prevResultRef.current) {
      prevResultRef.current = result;
      addEntry(result);
    }
  }, [result, addEntry]);

  const statusLabel = loading ? "Analyzing…" : result ? "Ready" : "Live";

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* ── Desktop Sidebar ──────────────────────────────────────────────── */}
      <Sidebar activeTab={activeTab} onTabChange={(t) => navigateTo(t as Tab)} />

      {/* ── Mobile overlay sidebar ───────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-64 bg-background shadow-xl z-50">
            <Sidebar activeTab={activeTab} onTabChange={(t) => navigateTo(t as Tab)} />
          </div>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Sticky top bar */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0 bg-background/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-1.5 rounded-md hover:bg-accent"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle sidebar"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Mobile logo */}
            <div className="flex items-center gap-2 md:hidden">
              <Leaf className="h-5 w-5 text-green-500" />
              <span className="font-bold text-sm">Token Analyzer</span>
            </div>

            {/* Desktop breadcrumb */}
            <span className="hidden md:block text-sm text-muted-foreground">
              AI Sustainability Analyzer
            </span>
            <span className="hidden md:block text-muted-foreground">/</span>
            <span className="hidden md:block text-sm font-semibold">
              {TAB_LABELS[activeTab]}
            </span>
          </div>

          {/* Status pill */}
          <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1">
            <div className={`h-1.5 w-1.5 rounded-full bg-green-500 ${loading ? "animate-pulse" : ""}`} />
            {statusLabel}
            {history.length > 0 && !loading && (
              <span className="ml-1 text-muted-foreground">· {history.length} session{history.length > 1 ? "s" : ""}</span>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">

            {activeTab === "dashboard" && (
              <DashboardPanel
                stats={stats}
                recentChart={recentChart}
                carbonChart={carbonChart}
                history={history}
                onGoToAnalyzer={() => navigateTo("analyzer")}
                onClearHistory={clearHistory}
              />
            )}

            {activeTab === "analyzer" && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <AnalyzerPanel
                  loading={loading}
                  error={error}
                  onAnalyze={handleAnalyze}
                  onReset={reset}
                />
                {result && <ResultsPanel result={result} />}
              </div>
            )}

            {activeTab === "comparison" && (
              <ComparisonPanel
                result={result}
                onGoToAnalyzer={() => navigateTo("analyzer")}
              />
            )}

            {activeTab === "suggestions" && (
              <SuggestionsPanel result={result} />
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
